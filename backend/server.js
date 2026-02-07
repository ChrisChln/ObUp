import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

const uploadRoot = path.join(__dirname, 'uploads')
const knownTypes = ['picking', 'packing', 'sorting', 'attendance']
const uploadsByType = new Map()
const latestByType = new Map()
const sortingReports = new Map()
const pickingReports = new Map()
const attendanceReports = new Map()
const packingReports = new Map()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
const punchSupabaseUrl = process.env.OBPUNCH_SUPABASE_URL
const punchSupabaseKey = process.env.OBPUNCH_SUPABASE_SERVICE_ROLE_KEY
const punchSupabase =
  punchSupabaseUrl && punchSupabaseKey ? createClient(punchSupabaseUrl, punchSupabaseKey) : null

const workTimezone = process.env.WORK_TIMEZONE || ''

const ensureTypeMap = (type) => {
  if (!uploadsByType.has(type)) uploadsByType.set(type, new Map())
  return uploadsByType.get(type)
}

const isAllowedFile = (file) => {
  const allowed = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ]
  return allowed.includes(file.mimetype)
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dateKey = req.body?.date || 'unknown'
    const type = req.body?.type || 'unknown'
    const dir = path.join(uploadRoot, dateKey, type)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname) || '.xlsx'
    const base = path.basename(file.originalname, ext)
    const stamp = Date.now()
    cb(null, `${base}-${stamp}${ext}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!isAllowedFile(file)) {
      cb(new Error('Only xlsx/xls/csv files are allowed'))
      return
    }
    cb(null, true)
  },
  limits: { fileSize: 50 * 1024 * 1024 },
})

const toTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const pad2 = (value) => String(value).padStart(2, '0')
const toDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

const zonedTimeToUtc = (y, m, d, hh, mm, ss, tz) => {
  const utcDate = new Date(Date.UTC(y, m - 1, d, hh, mm, ss))
  const tzDate = new Date(utcDate.toLocaleString('en-US', { timeZone: tz }))
  const offsetMs = tzDate.getTime() - utcDate.getTime()
  return new Date(utcDate.getTime() - offsetMs)
}

const windowForWorkDate = (workDateStr) => {
  const [y, m, d] = workDateStr.split('-').map(Number)
  let start = null
  if (workTimezone) {
    try {
      start = zonedTimeToUtc(y, m, d, 5, 0, 0, workTimezone)
    } catch (error) {
      console.warn('Invalid WORK_TIMEZONE, fallback to server time', error)
    }
  }
  if (!start) start = new Date(y, m - 1, d, 5, 0, 0, 0)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

const parseTimestamp = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const dateOnly = trimmed.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/)
    if (dateOnly) {
      const [, y, m, d] = dateOnly
      return new Date(Number(y), Number(m) - 1, Number(d))
    }
    const match = trimmed.match(
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
    )
    if (match) {
      const [, y, m, d, hh, mm, ss] = match
      return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss || 0))
    }
    const t = Date.parse(trimmed)
    if (!Number.isNaN(t)) return new Date(t)
  }
  return null
}

const findColumn = (headers, aliases) => {
  const normalized = headers.map((item) => String(item ?? '').trim())
  for (const alias of aliases) {
    const idx = normalized.findIndex((item) => item === alias)
    if (idx >= 0) return idx
  }
  for (const alias of aliases) {
    const idx = normalized.findIndex((item) => item.includes(alias))
    if (idx >= 0) return idx
  }
  return -1
}

const detectFileKind = (headers) => {
  const normalized = headers.map((item) => String(item ?? '').trim())
  const has = (labels) => labels.some((label) => normalized.some((h) => h === label || h.includes(label)))
  const pickingCore = ['拣货员', '拣货时间']
  const pickingUnits = ['拣货数量', '件数', '数量']
  const sortingTime = ['分拨时间', '操作时间', '扫描时间']
  const sortingPerson = ['分拨员', '分拣员', '操作人', '操作员']
  const sortingUnits = ['二分数', '分拨数', '件数', '数量']
  const packingMarkers = ['扫描件数', '商品数量分类名称']
  const attendanceMarkers = ['考勤日期', '最终核算时长', '班次类型', '班次分类', '班次', '班别']
  const hasPicking = has(pickingCore) && has(pickingUnits)
  const hasSorting = has(sortingTime) && has(sortingPerson) && has(sortingUnits)
  const hasPacking = has(packingMarkers) && has(['操作人']) && has(['操作时间'])
  const hasAttendance = has(attendanceMarkers)
  if (hasPicking && !hasSorting && !hasAttendance && !hasPacking) return 'picking'
  if (!hasPicking && hasSorting && !hasAttendance && !hasPacking) return 'sorting'
  if (!hasPicking && !hasSorting && !hasAttendance && hasPacking) return 'packing'
  if (hasAttendance && !hasPicking && !hasSorting && !hasPacking) return 'attendance'
  if ((hasPicking && hasSorting) || (hasPicking && hasPacking) || (hasSorting && hasPacking)) return 'mixed'
  return 'unknown'
}

const readSheetRows = (filePath) => {
  const workbook = XLSX.readFile(filePath, { cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true })
}

const buildSegmentsForEvents = (list, start, end, gapMs, options = {}) => {
  const { includeIdle = true, splitOnCategory = false } = options
  if (!list.length) return { segs: [], ewhMs: 0 }
  const sorted = [...list].sort((a, b) => a.ts - b.ts)
  let ewhMs = 0
  const segs = []
  let current = null
  let lastEvent = null

  if (includeIdle && sorted[0].ts > start) {
    segs.push({ type: 'idle', start, end: sorted[0].ts })
  }

  sorted.forEach((event) => {
    if (!lastEvent) {
      current = {
        start: event.ts,
        end: event.ts,
        units: Number(event.units || 0),
        category: event.category || null,
      }
      lastEvent = event
      return
    }

    const diff = event.ts - lastEvent.ts
    if (diff > 0 && diff <= gapMs) {
      ewhMs += diff
    }

    const shouldSplitCategory =
      splitOnCategory &&
      current &&
      current.category &&
      event.category &&
      current.category !== event.category

    if (diff > 0 && diff <= gapMs && current && !shouldSplitCategory) {
      current.end = event.ts
      current.units += Number(event.units || 0)
    } else {
      if (current) {
        if (shouldSplitCategory && diff > 0 && diff <= gapMs) {
          current.end = event.ts
        }
        if (current.end > current.start) {
          segs.push({
            type: 'work',
            start: current.start,
            end: current.end,
            units: current.units,
            category: current.category || null,
          })
        }
      }

      if (includeIdle && diff > gapMs) {
        segs.push({ type: 'idle', start: lastEvent.ts, end: event.ts })
      }

      current = {
        start: event.ts,
        end: event.ts,
        units: Number(event.units || 0),
        category: event.category || null,
      }
    }

    lastEvent = event
  })

  if (current && current.end > current.start) {
    segs.push({
      type: 'work',
      start: current.start,
      end: current.end,
      units: current.units,
      category: current.category || null,
    })
  }

  if (includeIdle && lastEvent && lastEvent.ts < end) {
    segs.push({ type: 'idle', start: lastEvent.ts, end })
  }

  return { segs, ewhMs }
}

const computeReport = (workDateStr, events, gapMinutes = 15, stage = 'sorting') => {
  const { start, end } = windowForWorkDate(workDateStr)
  const gapMs = gapMinutes * 60 * 1000

  let parseFail = 0
  let minTs = null
  let maxTs = null

  const normalized = []
  for (const event of events) {
    const ts = parseTimestamp(event.ts)
    if (!ts) {
      parseFail += 1
      continue
    }
    const operator = String(event.operator ?? '').trim()
    if (!operator) {
      parseFail += 1
      continue
    }
    const rawUnits = typeof event.units === 'string' ? event.units.replace(/,/g, '') : event.units
    const units = Number(rawUnits)
    const u = Number.isFinite(units) ? units : 1

    if (!minTs || ts < minTs) minTs = ts
    if (!maxTs || ts > maxTs) maxTs = ts

    normalized.push({ operator, ts, units: u, inWindow: ts >= start && ts < end })
  }

  const totalCount = normalized.length + parseFail
  const inWindowEvents = normalized.filter((item) => item.inWindow)
  const inWindowCount = inWindowEvents.length
  const coverageRatio = totalCount ? inWindowCount / totalCount : 0
  const spanMs = minTs && maxTs ? maxTs - minTs : 0

  const byOperator = new Map()
  for (const ev of inWindowEvents) {
    if (!byOperator.has(ev.operator)) byOperator.set(ev.operator, [])
    byOperator.get(ev.operator).push(ev)
  }
  for (const list of byOperator.values()) {
    list.sort((a, b) => a.ts - b.ts)
  }

  const stats = []
  const segments = {}
  let totalUnitsAll = 0
  let totalEwhHoursAll = 0

  for (const [operator, list] of byOperator.entries()) {
    let units = 0
    for (const ev of list) units += ev.units

    const { segs, ewhMs } = buildSegmentsForEvents(list, start, end, gapMs, {
      includeIdle: true,
      splitOnCategory: false,
    })

    const ewhHours = ewhMs / 3600000
    const uph = ewhHours > 0 ? units / ewhHours : null

    stats.push({
      operator,
      totalUnits: units,
      ewhHours,
      uph,
    })

    segments[operator] = segs.map((seg) => ({
      type: seg.type,
      start: seg.start.toISOString(),
      end: seg.end.toISOString(),
      units: seg.units ?? null,
    }))

    totalUnitsAll += units
    totalEwhHoursAll += ewhHours
  }

  stats.sort((a, b) => b.totalUnits - a.totalUnits)

  let status = 'pass'
  const warnings = []
  const errors = []

  if (parseFail > 0) warnings.push(`解析失败：${parseFail} 行（已忽略）`)

  if (totalCount === 0) {
    status = 'reject'
    errors.push('文件没有可用记录')
  } else if (coverageRatio < 0.7) {
    status = 'reject'
    errors.push(`覆盖率 ${Math.round(coverageRatio * 100)}% < 70%：日期可能选错`)
  } else if (coverageRatio < 0.9) {
    status = 'warn'
    warnings.push(`覆盖率 ${Math.round(coverageRatio * 100)}%：窗口外记录已忽略`)
  }

  const spanLimit = 24 * 3600000 + 10 * 60000
  if (spanMs > spanLimit) {
    warnings.push(`时间跨度 ${(spanMs / 3600000).toFixed(2)} 小时超出 24h+10min`)
    if (status === 'pass') status = 'warn'
  }

  if (totalCount > 0 && totalCount < 100) {
    warnings.push(`记录数偏低（${totalCount}）`)
    if (status === 'pass') status = 'warn'
  }

  const employees = stats.length
  const avgUph = totalEwhHoursAll > 0 ? totalUnitsAll / totalEwhHoursAll : null

  return {
    meta: {
      stage,
      workDate: workDateStr,
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      gapMinutes,
      totalCount,
      inWindowCount,
      coverageRatio,
      parseFail,
      minTs: minTs ? minTs.toISOString() : null,
      maxTs: maxTs ? maxTs.toISOString() : null,
      spanMs,
      status,
      warnings,
      errors,
    },
    kpi: { employees, totalUnitsAll, totalEwhHoursAll, avgUph },
    stats,
    segments,
  }
}

const computeEwhForEvents = (events, start, end, gapMs) => {
  if (!events.length) return 0
  const list = [...events].sort((a, b) => a.ts - b.ts)
  let ewhMs = 0
  for (let i = 0; i < list.length - 1; i += 1) {
    const a = list[i].ts
    const b = list[i + 1].ts
    const diff = b - a
    if (diff <= 0) continue
    if (diff <= gapMs) ewhMs += diff
  }
  return ewhMs / 3600000
}

const chunkArray = (list, size) => {
  const chunks = []
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size))
  return chunks
}

const mergeAttendanceSegments = (segments) => {
  if (!segments.length) return []
  const sorted = [...segments].sort((a, b) => a.start - b.start)
  const merged = [sorted[0]]
  for (let i = 1; i < sorted.length; i += 1) {
    const last = merged[merged.length - 1]
    const current = sorted[i]
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ ...current })
    }
  }
  return merged
}

const buildAttendanceReportFromPunches = async (dateKey) => {
  if (!punchSupabase) return null
  const { start, end } = windowForWorkDate(dateKey)
  const windowStart = start.toISOString()
  const windowEnd = end.toISOString()

  const { data: punches, error } = await punchSupabase
    .from('ob_punches')
    .select('staff_id, action, created_at')
    .gte('created_at', windowStart)
    .lt('created_at', windowEnd)
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('Fetch ob_punches failed', error)
    throw error
  }

  if (!punches || punches.length === 0) {
    return { status: 'reject', errors: ['该日期无考勤记录'] }
  }

  const staffIds = Array.from(
    new Set(punches.map((row) => String(row.staff_id || '').trim()).filter(Boolean))
  )
  const staffNameMap = new Map()
  if (staffIds.length) {
    const chunks = chunkArray(staffIds, 500)
    for (const chunk of chunks) {
      const { data: employees, error: empError } = await punchSupabase
        .from('ob_employees')
        .select('staff_id, name')
        .in('staff_id', chunk)
      if (empError) {
        console.warn('Fetch ob_employees failed', empError)
        continue
      }
      ;(employees || []).forEach((emp) => {
        const key = String(emp.staff_id || '').trim()
        if (key && !staffNameMap.has(key)) {
          staffNameMap.set(key, String(emp.name || '').trim())
        }
      })
    }
  }

  const byStaff = new Map()
  punches.forEach((row) => {
    const staffId = String(row.staff_id || '').trim()
    if (!staffId) return
    const action = String(row.action || '').trim().toUpperCase()
    const ts = row.created_at ? new Date(row.created_at) : null
    if (!ts || Number.isNaN(ts.getTime())) return
    if (!byStaff.has(staffId)) byStaff.set(staffId, [])
    byStaff.get(staffId).push({ action, ts })
  })

  const stats = []
  const segments = {}
  let totalHours = 0

  byStaff.forEach((events, staffId) => {
    if (!events.length) return
    const sorted = [...events].sort((a, b) => a.ts - b.ts)
    let openStart = null
    const rawSegments = []

    sorted.forEach((event) => {
      if (event.action === 'IN') {
        if (!openStart) openStart = event.ts
        return
      }
      if (event.action === 'OUT') {
        if (openStart && event.ts > openStart) {
          rawSegments.push({ start: openStart, end: event.ts })
        }
        openStart = null
      }
    })

    if (openStart && end > openStart) {
      rawSegments.push({ start: openStart, end })
    }

    const merged = mergeAttendanceSegments(rawSegments)
    if (!merged.length) return

    const hours = merged.reduce((sum, seg) => sum + (seg.end - seg.start), 0) / 3600000
    totalHours += hours

    const name = staffNameMap.get(staffId) || staffId
    stats.push({
      operator: name,
      totalUnits: 0,
      ewhHours: hours,
      uph: 0,
    })

    segments[name] = merged.map((seg) => ({
      type: 'attendance',
      start: seg.start.toISOString(),
      end: seg.end.toISOString(),
    }))
  })

  if (!stats.length) {
    return { status: 'reject', errors: ['该日期无有效打卡记录'] }
  }

  return {
    meta: {
      stage: 'attendance',
      workDate: dateKey,
      windowStart,
      windowEnd,
      status: 'pass',
      coverageRatio: 1,
      totalCount: punches.length,
      inWindowCount: punches.length,
      warnings: [],
      errors: [],
    },
    kpi: { employees: stats.length, totalUnitsAll: 0, totalEwhHoursAll: totalHours, avgUph: 0 },
    stats,
    segments,
  }
}

const parsePackingFile = (filePath, dateKey) => {
  const rows = readSheetRows(filePath)
  if (!rows || rows.length < 2) {
    return { status: 'reject', errors: ['文件为空或只有表头'] }
  }

  const headers = rows[0].map((item) => String(item ?? '').trim())
  const kind = detectFileKind(headers)
  if (kind === 'attendance') {
    return { status: 'reject', errors: ['疑似考勤表，请上传打包表'] }
  }

  let idxUnits = findColumn(headers, ['扫描件数', '件数', '数量'])
  let idxCategory = findColumn(headers, ['商品数量分类名称', '数量分类名称', '数量分类'])
  let idxOperator = findColumn(headers, ['操作人', '操作员', '员工', '姓名'])
  let idxTs = findColumn(headers, ['操作时间', '扫描时间', '时间', 'Timestamp', 'Time'])

  if (idxUnits < 0 && headers.length > 7) idxUnits = 7 // H
  if (idxCategory < 0 && headers.length > 10) idxCategory = 10 // K
  if (idxOperator < 0 && headers.length > 21) idxOperator = 21 // V
  if (idxTs < 0 && headers.length > 23) idxTs = 23 // X

  const miss = []
  if (idxUnits < 0) miss.push('扫描件数')
  if (idxCategory < 0) miss.push('商品数量分类名称')
  if (idxOperator < 0) miss.push('操作人')
  if (idxTs < 0) miss.push('操作时间')

  if (miss.length) {
    return { status: 'reject', errors: [`缺少必需列：${miss.join('、')}`] }
  }

  const events = []
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    events.push({
      operator: row[idxOperator],
      ts: row[idxTs],
      units: row[idxUnits],
      category: row[idxCategory],
    })
  }

  const { start, end } = windowForWorkDate(dateKey)
  const gapMs = 15 * 60 * 1000
  let parseFail = 0
  let minTs = null
  let maxTs = null
  const normalized = []

  events.forEach((event) => {
    const ts = parseTimestamp(event.ts)
    if (!ts) {
      parseFail += 1
      return
    }
    const operator = String(event.operator ?? '').trim()
    if (!operator) {
      parseFail += 1
      return
    }
    const rawUnits = typeof event.units === 'string' ? event.units.replace(/,/g, '') : event.units
    const units = Number(rawUnits)
    const u = Number.isFinite(units) ? units : 1
    const categoryRaw = String(event.category ?? '').trim()
    const category = categoryRaw.includes('单品') ? 'single' : 'multi'

    if (!minTs || ts < minTs) minTs = ts
    if (!maxTs || ts > maxTs) maxTs = ts

    normalized.push({ operator, ts, units: u, category, inWindow: ts >= start && ts < end })
  })

  const totalCount = normalized.length + parseFail
  const inWindowEvents = normalized.filter((item) => item.inWindow)
  const inWindowCount = inWindowEvents.length
  const coverageRatio = totalCount ? inWindowCount / totalCount : 0
  const spanMs = minTs && maxTs ? maxTs - minTs : 0

  const byOperator = new Map()
  inWindowEvents.forEach((ev) => {
    if (!byOperator.has(ev.operator)) byOperator.set(ev.operator, [])
    byOperator.get(ev.operator).push(ev)
  })

  const stats = []
  const segments = {}
  let totalUnitsAll = 0
  let totalEwhHoursAll = 0

  for (const [operator, list] of byOperator.entries()) {
    const listSorted = [...list].sort((a, b) => a.ts - b.ts)
    let units = 0
    listSorted.forEach((ev) => {
      units += ev.units
    })

    const { segs, ewhMs } = buildSegmentsForEvents(listSorted, start, end, gapMs, {
      includeIdle: true,
      splitOnCategory: true,
    })

    const ewhHours = ewhMs / 3600000
    const uph = ewhHours > 0 ? units / ewhHours : null

    const singleEvents = listSorted.filter((ev) => ev.category === 'single')
    const multiEvents = listSorted.filter((ev) => ev.category === 'multi')
    const singleUnits = singleEvents.reduce((sum, ev) => sum + ev.units, 0)
    const multiUnits = multiEvents.reduce((sum, ev) => sum + ev.units, 0)
    const singleEwhHours = computeEwhForEvents(singleEvents, start, end, gapMs)
    const multiEwhHours = computeEwhForEvents(multiEvents, start, end, gapMs)

    stats.push({
      operator,
      totalUnits: units,
      ewhHours,
      uph,
      packingSingleUnits: singleUnits,
      packingMultiUnits: multiUnits,
      packingSingleEwhHours: singleEwhHours,
      packingMultiEwhHours: multiEwhHours,
    })

    segments[operator] = segs.map((seg) => ({
      type: seg.type,
      start: seg.start.toISOString(),
      end: seg.end.toISOString(),
      units: seg.units ?? null,
    }))

    totalUnitsAll += units
    totalEwhHoursAll += ewhHours
  }

  stats.sort((a, b) => b.totalUnits - a.totalUnits)

  let status = 'pass'
  const warnings = []
  const errors = []

  if (parseFail > 0) warnings.push(`解析失败：${parseFail} 行（已忽略）`)

  if (totalCount === 0) {
    status = 'reject'
    errors.push('文件没有可用记录')
  } else if (coverageRatio < 0.7) {
    status = 'reject'
    errors.push(`覆盖率 ${Math.round(coverageRatio * 100)}% < 70%：日期可能选错`)
  } else if (coverageRatio < 0.9) {
    status = 'warn'
    warnings.push(`覆盖率 ${Math.round(coverageRatio * 100)}%：窗口外记录已忽略`)
  }

  const spanLimit = 24 * 3600000 + 10 * 60000
  if (spanMs > spanLimit) {
    warnings.push(`时间跨度 ${(spanMs / 3600000).toFixed(2)} 小时超出 24h+10min`)
    if (status === 'pass') status = 'warn'
  }

  if (totalCount > 0 && totalCount < 100) {
    warnings.push(`记录数偏低（${totalCount}）`)
    if (status === 'pass') status = 'warn'
  }

  const employees = stats.length
  const avgUph = totalEwhHoursAll > 0 ? totalUnitsAll / totalEwhHoursAll : null

  return {
    meta: {
      stage: 'packing',
      workDate: dateKey,
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      gapMinutes: 15,
      totalCount,
      inWindowCount,
      coverageRatio,
      parseFail,
      minTs: minTs ? minTs.toISOString() : null,
      maxTs: maxTs ? maxTs.toISOString() : null,
      spanMs,
      status,
      warnings,
      errors,
    },
    kpi: { employees, totalUnitsAll, totalEwhHoursAll, avgUph },
    stats,
    segments,
  }
}

const parseSortingFile = (filePath, dateKey) => {
  const rows = readSheetRows(filePath)
  if (!rows || rows.length < 2) {
    return { status: 'reject', errors: ['文件为空或只有表头'] }
  }

  const headers = rows[0].map((item) => String(item ?? '').trim())
  const kind = detectFileKind(headers)
  if (kind === 'picking') {
    return { status: 'reject', errors: ['疑似拣货表，请上传分拨表'] }
  }
  if (kind === 'attendance') {
    return { status: 'reject', errors: ['疑似考勤表，请上传分拨表'] }
  }
  if (kind === 'mixed') {
    return { status: 'reject', errors: ['表头同时包含拣货/分拨字段，请确认文件类型'] }
  }
  if (kind === 'unknown') {
    return { status: 'reject', errors: ['无法识别表头，请确认是分拨文件'] }
  }
  const idxOperator = findColumn(headers, ['分拨员', '分拣员', '操作人', '操作员', '员工', '姓名'])
  const idxTs = findColumn(headers, ['分拨时间', '扫描时间', '操作时间', 'Timestamp', 'Time'])
  const idxUnits = findColumn(headers, ['二分数', '分拨数', '件数', '数量', 'Units', 'Qty'])

  const miss = []
  if (idxOperator < 0) miss.push('操作人')
  if (idxTs < 0) miss.push('操作时间')
  if (idxUnits < 0) miss.push('二分数')

  if (miss.length) {
    return { status: 'reject', errors: [`缺少必需列：${miss.join('、')}`] }
  }

  const events = []
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    events.push({ operator: row[idxOperator], ts: row[idxTs], units: row[idxUnits] })
  }

  return computeReport(dateKey, events, 15, 'sorting')
}

const parsePickingFile = (filePath, dateKey) => {
  const rows = readSheetRows(filePath)
  if (!rows || rows.length < 2) {
    return { status: 'reject', errors: ['文件为空或只有表头'] }
  }

  const headers = rows[0].map((item) => String(item ?? '').trim())
  const kind = detectFileKind(headers)
  if (kind === 'sorting') {
    return { status: 'reject', errors: ['疑似分拨表，请上传拣货表'] }
  }
  if (kind === 'attendance') {
    return { status: 'reject', errors: ['疑似考勤表，请上传拣货表'] }
  }
  if (kind === 'mixed') {
    return { status: 'reject', errors: ['表头同时包含拣货/分拨字段，请确认文件类型'] }
  }
  if (kind === 'unknown') {
    return { status: 'reject', errors: ['无法识别表头，请确认是拣货文件'] }
  }
  const idxOperator = findColumn(headers, ['拣货员', '操作人', '操作员', '员工', '姓名'])
  const idxTs = findColumn(headers, ['拣货时间', '操作时间', 'Timestamp', 'Time'])
  const idxUnits = findColumn(headers, ['拣货数量', '件数', '数量', 'Units', 'Qty'])

  const miss = []
  if (idxOperator < 0) miss.push('拣货员')
  if (idxTs < 0) miss.push('拣货时间')
  if (idxUnits < 0) miss.push('拣货数量')

  if (miss.length) {
    return { status: 'reject', errors: [`缺少必需列：${miss.join('、')}`] }
  }

  const events = []
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    events.push({ operator: row[idxOperator], ts: row[idxTs], units: row[idxUnits] })
  }

  return computeReport(dateKey, events, 15, 'picking')
}

const parseAttendanceFile = (filePath, dateKey) => {
  const rows = readSheetRows(filePath)
  if (!rows || rows.length < 2) {
    return { status: 'reject', errors: ['文件为空或只有表头'] }
  }

  const headerAliases = ['姓名', '考勤日期', '最终核算时长', '班次类型', '班次分类', '班次', '班别']
  let headerRowIndex = 0
  for (let i = 0; i < Math.min(rows.length, 8); i += 1) {
    const row = rows[i] || []
    const hit = row.some((cell) =>
      headerAliases.some((alias) => String(cell ?? '').trim().includes(alias))
    )
    if (hit) {
      headerRowIndex = i
      break
    }
  }

  const headers = (rows[headerRowIndex] || []).map((item) => String(item ?? '').trim())
  const kind = detectFileKind(headers)
  if (kind === 'picking') {
    return { status: 'reject', errors: ['疑似拣货表，请上传考勤表'] }
  }
  if (kind === 'sorting') {
    return { status: 'reject', errors: ['疑似分拨表，请上传考勤表'] }
  }
  if (kind === 'mixed') {
    return { status: 'reject', errors: ['表头包含拣货/分拨字段，请确认文件类型'] }
  }

  let idxName = findColumn(headers, ['姓名', '员工', '员工姓名'])
  let idxDate = findColumn(headers, ['考勤日期', '日期'])
  let idxHours = findColumn(headers, [
    '最终核算时长（小时）',
    '最终核算时长(小时)',
    '最终核算时长',
    '核算时长',
    '工时（小时）',
    '工时(小时)',
    '工时',
    '时长',
  ])
  let idxShift = findColumn(headers, ['班次类型', '班次分类', '班次', '班别'])

  // fallback to fixed columns if header missing
  if (idxDate < 0 && headers.length > 1) idxDate = 1 // B
  if (idxName < 0 && headers.length > 3) idxName = 3 // D
  if (idxHours < 0 && headers.length > 30) idxHours = 30 // AE
  if (idxShift < 0 && headers.length > 31) idxShift = 31 // AF

  const miss = []
  if (idxName < 0) miss.push('姓名')
  if (idxDate < 0) miss.push('考勤日期')
  if (idxHours < 0) miss.push('最终核算时长（小时）')
  // 班次类型允许为空或缺失

  if (miss.length) {
    return { status: 'reject', errors: [`缺少必需列：${miss.join('、')}`] }
  }

  const stats = []
  let totalHours = 0
  const byName = new Map()
  const dateSet = new Set()

  const scanRows = (startIndex, nameIndex, dateIndex, hoursIndex, shiftIndex) => {
    for (let i = startIndex; i < rows.length; i += 1) {
      const row = rows[i]
      if (!row || !row.length) continue
      const name = String(row[nameIndex] ?? '').trim()
      const dateValue = row[dateIndex]
      const ts = parseTimestamp(dateValue)
      if (!name || !ts) continue
      const rowDate = toDateKey(ts)
      dateSet.add(rowDate)
      if (rowDate !== dateKey) continue
      const rawHours = typeof row[hoursIndex] === 'string' ? row[hoursIndex].replace(/,/g, '') : row[hoursIndex]
      const hours = Number(rawHours)
      const h = Number.isFinite(hours) ? hours : 0
      if (h <= 0) continue
      const shift = shiftIndex >= 0 ? String(row[shiftIndex] ?? '').trim() : ''
      if (!byName.has(name)) {
        byName.set(name, { operator: name, totalUnits: 0, ewhHours: 0, uph: 0, shiftType: shift })
      }
      const entry = byName.get(name)
      entry.ewhHours += h
      if (!entry.shiftType && shift) entry.shiftType = shift
      totalHours += h
    }
  }

  scanRows(headerRowIndex + 1, idxName, idxDate, idxHours, idxShift)

  if (!byName.size) {
    // fallback to fixed column positions: B(1), D(3), AE(30), AF(31)
    scanRows(1, 3, 1, 30, 31)
  }

  byName.forEach((entry) => stats.push(entry))

  if (!stats.length) {
    const dates = Array.from(dateSet).slice(0, 5).join(', ')
    return {
      status: 'reject',
      errors: [dateSet.size ? `该日期无考勤记录，文件包含日期：${dates}` : '该日期无考勤记录'],
    }
  }

  return {
    meta: {
      stage: 'attendance',
      workDate: dateKey,
      windowStart: windowForWorkDate(dateKey).start.toISOString(),
      windowEnd: windowForWorkDate(dateKey).end.toISOString(),
      status: 'pass',
      coverageRatio: 1,
      warnings: [],
      errors: [],
    },
    kpi: { employees: stats.length, totalUnitsAll: 0, totalEwhHoursAll: totalHours, avgUph: 0 },
    stats,
    segments: {},
  }
}

const saveReport = async (report, stage) => {
  if (!supabase) return null
  const insertPayload = {
    work_date: report.meta.workDate,
    stage,
    status: report.meta.status,
    coverage_ratio: report.meta.coverageRatio,
    total_records: report.meta.totalCount,
    in_window_records: report.meta.inWindowCount,
    employees: report.kpi.employees,
    total_units: report.kpi.totalUnitsAll,
    total_ewh_hours: report.kpi.totalEwhHoursAll,
    avg_uph: report.kpi.avgUph,
    meta: {
      ...report.meta,
      _stats: report.stats,
      _segments: report.segments,
      _kpi: report.kpi,
    },
  }

  const { data: reportRow, error } = await supabase
    .from('reports')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error || !reportRow) {
    console.warn('Failed to save report', error)
    return { ok: false, error }
  }

  const rows = report.stats.map((stat) => ({
    report_id: reportRow.id,
    operator: stat.operator,
    total_units: stat.totalUnits,
    ewh_hours: stat.ewhHours,
    uph: stat.uph,
    segments: report.segments?.[stat.operator] || [],
  }))

  if (rows.length) {
    const { error: detailError } = await supabase.from('report_details').insert(rows)
    if (detailError) {
      console.warn('Failed to save report details', detailError)
      return { ok: false, error: detailError }
    }
  }

  return { ok: true, id: reportRow.id }
}

const saveUploadRecord = async (record) => {
  if (!supabase) return null
  const payload = {
    work_date: record.dateKey,
    stage: record.type,
    filename: record.filename,
    original_name: record.originalName,
    validation_status: record.validationStatus,
    validation_errors: record.validationErrors || [],
    validation_warnings: record.validationWarnings || [],
  }
  const { error } = await supabase.from('upload_records').insert(payload)
  if (error) console.warn('Failed to save upload record', error)
  return !error
}

const fetchUploadStatus = async (date) => {
  if (!supabase) return null
  const result = {}

  await Promise.all(
    knownTypes.map(async (type) => {
      let exact = null
      try {
        const { data } = await supabase
          .from('upload_records')
          .select('*')
          .eq('work_date', date)
          .eq('stage', type)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        exact = data
      } catch (error) {
        console.warn('Fetch upload_records exact failed', error)
      }

      if (exact) {
        result[type] = {
          status: exact.validation_status === 'reject' ? 'error' : 'success',
          dateKey: exact.work_date,
          updated: toTime(),
          filename: exact.filename,
          originalName: exact.original_name,
          validationStatus: exact.validation_status,
          validationErrors: exact.validation_errors || [],
          validationWarnings: exact.validation_warnings || [],
        }
        return
      }

      result[type] = { status: 'waiting', dateKey: '', updated: '--' }
    })
  )

  return result
}

const fetchReport = async (date, stage) => {
  if (!supabase) return null
  const { data: reportRow, error } = await supabase
    .from('reports')
    .select('*')
    .eq('work_date', date)
    .eq('stage', stage)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('Fetch report failed', error)
  }
  if (!reportRow) return null

  if (reportRow.meta?._stats) {
    return {
      meta: { ...reportRow.meta, _stats: undefined, _segments: undefined, _kpi: undefined },
      kpi: reportRow.meta._kpi || reportRow.kpi || {},
      stats: reportRow.meta._stats || [],
      segments: reportRow.meta._segments || {},
    }
  }

  const { data: details } = await supabase
    .from('report_details')
    .select('*')
    .eq('report_id', reportRow.id)

  const stats = (details || []).map((item) => ({
    operator: item.operator,
    totalUnits: item.total_units,
    ewhHours: Number(item.ewh_hours || 0),
    uph: item.uph,
  }))

  const segments = {}
  ;(details || []).forEach((item) => {
    segments[item.operator] = item.segments || []
  })

  return {
    meta: reportRow.meta,
    kpi: {
      employees: reportRow.employees ?? stats.length,
      totalUnitsAll: reportRow.total_units ?? stats.reduce((sum, s) => sum + (s.totalUnits || 0), 0),
      totalEwhHoursAll:
        reportRow.total_ewh_hours ?? stats.reduce((sum, s) => sum + (Number(s.ewhHours) || 0), 0),
      avgUph: reportRow.avg_uph,
    },
    stats,
    segments,
  }
}

const getLatestUploadRecord = async (date, type) => {
  if (supabase) {
    const { data, error } = await supabase
      .from('upload_records')
      .select('*')
      .eq('work_date', date)
      .eq('stage', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.warn('Fetch upload record failed', error)
      return null
    }
    return data || null
  }
  const byType = ensureTypeMap(type)
  return byType.get(date) || null
}

const pickLatestFileFromDir = (dir) => {
  if (!fs.existsSync(dir)) return null
  const files = fs
    .readdirSync(dir)
    .map((name) => {
      const full = path.join(dir, name)
      const stat = fs.statSync(full)
      return { name, full, time: stat.mtimeMs }
    })
    .filter((item) => item && !Number.isNaN(item.time))
    .sort((a, b) => b.time - a.time)
  return files[0]?.full || null
}

const rebuildReportFromUpload = async (date, stage) => {
  const record = await getLatestUploadRecord(date, stage)
  if (!record) return null
  let filename = record?.filename || record?.original_name || null
  let filePath = null
  if (filename) {
    const candidate = path.join(uploadRoot, date, stage, filename)
    if (fs.existsSync(candidate)) filePath = candidate
  }
  if (!filePath) {
    filePath = pickLatestFileFromDir(path.join(uploadRoot, date, stage))
  }
  if (!filePath) return null

  if (stage === 'sorting') return parseSortingFile(filePath, date)
  if (stage === 'picking') return parsePickingFile(filePath, date)
  if (stage === 'attendance') return parseAttendanceFile(filePath, date)
  if (stage === 'packing') return parsePackingFile(filePath, date)
  return null
}

const getReportFromMemory = (date, stage) => {
  if (stage === 'sorting') return sortingReports.get(date) || null
  if (stage === 'picking') return pickingReports.get(date) || null
  if (stage === 'attendance') return attendanceReports.get(date) || null
  if (stage === 'packing') return packingReports.get(date) || null
  return null
}

const deleteReport = async (date, stage) => {
  if (!supabase) return false
  const { data: reportRow } = await supabase
    .from('reports')
    .select('id')
    .eq('work_date', date)
    .eq('stage', stage)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (reportRow?.id) {
    await supabase.from('report_details').delete().eq('report_id', reportRow.id)
    await supabase.from('reports').delete().eq('id', reportRow.id)
  }
  return true
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/whitelist', async (req, res) => {
  if (!supabase) {
    res.json({ ok: true, whitelist: [] })
    return
  }
  try {
    const { data, error } = await supabase
      .from('whitelist')
      .select('name, role')
      .order('name')
    if (error) {
      console.warn('Fetch whitelist failed', error)
      res.json({ ok: true, whitelist: [] })
      return
    }
    res.json({ ok: true, whitelist: data || [] })
  } catch (error) {
    console.error('Whitelist error', error)
    res.json({ ok: true, whitelist: [] })
  }
})

app.get('/api/account-links', async (req, res) => {
  if (!supabase) {
    res.json({ ok: true, links: [] })
    return
  }
  try {
    const { data, error } = await supabase
      .from('account_links')
      .select('source_name,target_name')
      .order('source_name')
    if (error) {
      console.warn('Fetch account_links failed', error)
      res.json({ ok: true, links: [] })
      return
    }
    res.json({ ok: true, links: data || [] })
  } catch (error) {
    console.error('Account links error', error)
    res.json({ ok: true, links: [] })
  }
})

app.post('/api/account-links', async (req, res) => {
  const sourceName = String(req.body?.sourceName || '').trim()
  const targetName = String(req.body?.targetName || '').trim()
  if (!sourceName || !targetName) {
    res.status(400).json({ ok: false, message: 'sourceName and targetName are required' })
    return
  }
  if (!supabase) {
    res.json({ ok: true })
    return
  }
  try {
    const { error } = await supabase
      .from('account_links')
      .upsert({ source_name: sourceName, target_name: targetName }, { onConflict: 'source_name' })
    if (error) {
      console.warn('Upsert account_links failed', error)
      res.status(500).json({ ok: false, message: 'save failed' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('Save account link error', error)
    res.status(500).json({ ok: false, message: 'save failed' })
  }
})

app.delete('/api/account-links', async (req, res) => {
  const sourceName = String(req.query?.sourceName || '').trim()
  if (!supabase) {
    res.json({ ok: true })
    return
  }
  try {
    let query = supabase.from('account_links').delete()
    if (sourceName) query = query.eq('source_name', sourceName)
    const { error } = await query
    if (error) {
      console.warn('Delete account_links failed', error)
      res.status(500).json({ ok: false, message: 'delete failed' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete account link error', error)
    res.status(500).json({ ok: false, message: 'delete failed' })
  }
})

app.get('/api/name-matches', async (req, res) => {
  const workDate = String(req.query?.date || '').trim()
  if (!supabase) {
    res.json({ ok: true, matches: [] })
    return
  }
  try {
    let query = supabase.from('name_matches').select('source_name,target_name,work_date')
    if (workDate) query = query.eq('work_date', workDate)
    const { data, error } = await query
    if (error) {
      console.warn('Fetch name_matches failed', error)
      res.json({ ok: true, matches: [] })
      return
    }
    res.json({ ok: true, matches: data || [] })
  } catch (error) {
    console.error('Name matches error', error)
    res.json({ ok: true, matches: [] })
  }
})

app.post('/api/name-matches', async (req, res) => {
  const sourceName = String(req.body?.sourceName || '').trim()
  const targetName = String(req.body?.targetName || '').trim()
  const workDate = String(req.body?.date || '').trim()
  if (!sourceName || !targetName || !workDate) {
    res.status(400).json({ ok: false, message: 'sourceName and targetName are required' })
    return
  }
  if (!supabase) {
    res.json({ ok: true })
    return
  }
  try {
    const { error } = await supabase
      .from('name_matches')
      .upsert(
        { work_date: workDate, source_name: sourceName, target_name: targetName },
        { onConflict: 'work_date,source_name' }
      )
    if (error) {
      console.warn('Upsert name_matches failed', error)
      res.status(500).json({ ok: false, message: 'save failed' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('Save name match error', error)
    res.status(500).json({ ok: false, message: 'save failed' })
  }
})

app.delete('/api/name-matches', async (req, res) => {
  const sourceName = String(req.query?.sourceName || '').trim()
  const workDate = String(req.query?.date || '').trim()
  if (!sourceName || !workDate) {
    res.status(400).json({ ok: false, message: 'sourceName is required' })
    return
  }
  if (!supabase) {
    res.json({ ok: true })
    return
  }
  try {
    const { error } = await supabase
      .from('name_matches')
      .delete()
      .eq('work_date', workDate)
      .eq('source_name', sourceName)
    if (error) {
      console.warn('Delete name_matches failed', error)
      res.status(500).json({ ok: false, message: 'delete failed' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete name match error', error)
    res.status(500).json({ ok: false, message: 'delete failed' })
  }
})

app.post('/api/whitelist', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  const role = String(req.body?.role || '').trim()
  if (!name || !role) {
    res.status(400).json({ ok: false, message: 'name and role are required' })
    return
  }
  if (!supabase) {
    res.json({ ok: true })
    return
  }
  try {
    const { error } = await supabase
      .from('whitelist')
      .upsert({ name, role }, { onConflict: 'name' })
    if (error) {
      console.warn('Add whitelist failed', error)
      res.status(500).json({ ok: false, message: 'add failed' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('Add whitelist error', error)
    res.status(500).json({ ok: false, message: 'add failed' })
  }
})

app.delete('/api/whitelist', async (req, res) => {
  const name = String(req.query?.name || '').trim()
  if (!name) {
    res.status(400).json({ ok: false, message: 'name is required' })
    return
  }
  if (!supabase) {
    res.json({ ok: true })
    return
  }
  try {
    const { error } = await supabase.from('whitelist').delete().eq('name', name)
    if (error) {
      console.warn('Delete whitelist failed', error)
      res.status(500).json({ ok: false, message: 'delete failed' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete whitelist error', error)
    res.status(500).json({ ok: false, message: 'delete failed' })
  }
})

app.get('/api/uploads', async (req, res) => {
  const date = req.query.date
  if (!date) {
    res.status(400).json({ ok: false, message: 'date is required' })
    return
  }

  if (supabase) {
    try {
      const result = await fetchUploadStatus(date)
      res.json(result)
      return
    } catch (error) {
      console.error('Upload status error', error)
      res.status(500).json({ ok: false, message: 'upload status failed' })
      return
    }
  }

  const result = {}
  knownTypes.forEach((type) => {
    const byType = ensureTypeMap(type)
    if (date && byType.has(date)) {
      const record = byType.get(date)
      if (record.validationStatus === 'reject') {
        result[type] = { status: 'error', ...record }
      } else {
        result[type] = { status: 'success', ...record }
      }
      return
    }
    if (latestByType.has(type)) {
      result[type] = { status: 'error', ...latestByType.get(type) }
      return
    }
    result[type] = { status: 'waiting', dateKey: '', updated: '--' }
  })

  res.json(result)
})

app.get('/api/reports/sorting', async (req, res) => {
  const date = req.query.date
  if (!date) {
    res.status(400).json({ ok: false, message: 'date is required' })
    return
  }

  if (supabase) {
    try {
      let report = (await fetchReport(date, 'sorting')) || getReportFromMemory(date, 'sorting')
      if (!report) {
        const rebuilt = await rebuildReportFromUpload(date, 'sorting')
        if (rebuilt?.meta) {
          sortingReports.set(date, rebuilt)
          report = rebuilt
        } else if (rebuilt?.status === 'reject') {
          res.status(422).json({ ok: false, message: 'report rebuild failed', errors: rebuilt.errors })
          return
        }
      }
      if (!report) {
        res.status(404).json({ ok: false, message: 'report not found' })
        return
      }
      res.json({ ok: true, report })
      return
    } catch (error) {
      console.error('Sorting report error', error)
      res.status(500).json({ ok: false, message: 'report load failed' })
      return
    }
  }

  if (!sortingReports.has(date)) {
    res.status(404).json({ ok: false, message: 'report not found' })
    return
  }
  res.json({ ok: true, report: sortingReports.get(date) })
})

app.get('/api/reports/picking', async (req, res) => {
  const date = req.query.date
  if (!date) {
    res.status(400).json({ ok: false, message: 'date is required' })
    return
  }

  if (supabase) {
    try {
      let report = (await fetchReport(date, 'picking')) || getReportFromMemory(date, 'picking')
      if (!report) {
        const rebuilt = await rebuildReportFromUpload(date, 'picking')
        if (rebuilt?.meta) {
          pickingReports.set(date, rebuilt)
          report = rebuilt
        } else if (rebuilt?.status === 'reject') {
          res.status(422).json({ ok: false, message: 'report rebuild failed', errors: rebuilt.errors })
          return
        }
      }
      if (!report) {
        res.status(404).json({ ok: false, message: 'report not found' })
        return
      }
      res.json({ ok: true, report })
      return
    } catch (error) {
      console.error('Picking report error', error)
      res.status(500).json({ ok: false, message: 'report load failed' })
      return
    }
  }

  if (!pickingReports.has(date)) {
    res.status(404).json({ ok: false, message: 'report not found' })
    return
  }
  res.json({ ok: true, report: pickingReports.get(date) })
})

app.get('/api/reports/attendance', async (req, res) => {
  const date = req.query.date
  if (!date) {
    res.status(400).json({ ok: false, message: 'date is required' })
    return
  }

  if (punchSupabase) {
    try {
      const report = await buildAttendanceReportFromPunches(date)
      if (report?.meta) {
        res.json({ ok: true, report })
        return
      }
      if (report?.status === 'reject') {
        res.status(422).json({ ok: false, message: 'attendance not found', errors: report.errors })
        return
      }
      res.status(404).json({ ok: false, message: 'report not found' })
      return
    } catch (error) {
      console.error('Attendance punch report error', error)
      res.status(500).json({ ok: false, message: 'report load failed' })
      return
    }
  }

  if (supabase) {
    try {
      let report = (await fetchReport(date, 'attendance')) || getReportFromMemory(date, 'attendance')
      if (!report) {
        const rebuilt = await rebuildReportFromUpload(date, 'attendance')
        if (rebuilt?.meta) {
          attendanceReports.set(date, rebuilt)
          report = rebuilt
        } else if (rebuilt?.status === 'reject') {
          res.status(422).json({ ok: false, message: 'report rebuild failed', errors: rebuilt.errors })
          return
        }
      }
      if (!report) {
        res.status(404).json({ ok: false, message: 'report not found' })
        return
      }
      res.json({ ok: true, report })
      return
    } catch (error) {
      console.error('Attendance report error', error)
      res.status(500).json({ ok: false, message: 'report load failed' })
      return
    }
  }

  if (!attendanceReports.has(date)) {
    res.status(404).json({ ok: false, message: 'report not found' })
    return
  }
  res.json({ ok: true, report: attendanceReports.get(date) })
})

app.get('/api/reports/packing', async (req, res) => {
  const date = req.query.date
  if (!date) {
    res.status(400).json({ ok: false, message: 'date is required' })
    return
  }

  if (supabase) {
    try {
      let report = (await fetchReport(date, 'packing')) || getReportFromMemory(date, 'packing')
      if (!report) {
        const rebuilt = await rebuildReportFromUpload(date, 'packing')
        if (rebuilt?.meta) {
          packingReports.set(date, rebuilt)
          report = rebuilt
        } else if (rebuilt?.status === 'reject') {
          res.status(422).json({ ok: false, message: 'report rebuild failed', errors: rebuilt.errors })
          return
        }
      }
      if (!report) {
        res.status(404).json({ ok: false, message: 'report not found' })
        return
      }
      res.json({ ok: true, report })
      return
    } catch (error) {
      console.error('Packing report error', error)
      res.status(500).json({ ok: false, message: 'report load failed' })
      return
    }
  }

  if (!packingReports.has(date)) {
    res.status(404).json({ ok: false, message: 'report not found' })
    return
  }
  res.json({ ok: true, report: packingReports.get(date) })
})

app.post('/api/uploads', upload.single('file'), async (req, res) => {
  const { date, type } = req.body
  if (!date || !type) {
    res.status(400).json({ ok: false, message: 'date and type are required' })
    return
  }
  if (!knownTypes.includes(type)) {
    res.status(400).json({ ok: false, message: 'type is invalid' })
    return
  }
  if (!req.file) {
    res.status(400).json({ ok: false, message: 'file is required' })
    return
  }

  let validationStatus = 'pass'
  let validationErrors = []
  let validationWarnings = []

  if (type === 'sorting') {
    try {
      const report = parseSortingFile(req.file.path, date)
      if (report?.meta) {
        sortingReports.set(date, report)
        validationStatus = report.meta.status
        validationErrors = report.meta.errors || []
        validationWarnings = report.meta.warnings || []
        const saveResult = await saveReport(report, 'sorting')
        if (saveResult?.ok === false) {
          validationWarnings.push('报告保存失败（将使用本地缓存）')
        }
      } else if (report?.status === 'reject') {
        validationStatus = 'reject'
        validationErrors = report.errors || []
        sortingReports.delete(date)
      }
    } catch (error) {
      console.error('Sorting parse failed', error)
      validationStatus = 'reject'
      validationErrors = ['分拨文件解析失败']
    }
  }

  if (type === 'picking') {
    try {
      const report = parsePickingFile(req.file.path, date)
      if (report?.meta) {
        pickingReports.set(date, report)
        validationStatus = report.meta.status
        validationErrors = report.meta.errors || []
        validationWarnings = report.meta.warnings || []
        const saveResult = await saveReport(report, 'picking')
        if (saveResult?.ok === false) {
          validationWarnings.push('报告保存失败（将使用本地缓存）')
        }
      } else if (report?.status === 'reject') {
        validationStatus = 'reject'
        validationErrors = report.errors || []
        pickingReports.delete(date)
      }
    } catch (error) {
      console.error('Picking parse failed', error)
      validationStatus = 'reject'
      validationErrors = ['拣货文件解析失败']
    }
  }

  if (type === 'attendance') {
    try {
      const report = parseAttendanceFile(req.file.path, date)
      if (report?.meta) {
        validationStatus = report.meta.status
        validationErrors = report.meta.errors || []
        validationWarnings = report.meta.warnings || []
        attendanceReports.set(date, report)
        const saveResult = await saveReport(report, 'attendance')
        if (saveResult?.ok === false) {
          validationWarnings.push('报告保存失败（将使用本地缓存）')
        }
      } else if (report?.status === 'reject') {
        validationStatus = 'reject'
        validationErrors = report.errors || []
      }
    } catch (error) {
      console.error('Attendance parse failed', error)
      validationStatus = 'reject'
      validationErrors = ['考勤文件解析失败']
    }
  }

  if (type === 'packing') {
    try {
      const report = parsePackingFile(req.file.path, date)
      if (report?.meta) {
        validationStatus = report.meta.status
        validationErrors = report.meta.errors || []
        validationWarnings = report.meta.warnings || []
        packingReports.set(date, report)
        const saveResult = await saveReport(report, 'packing')
        if (saveResult?.ok === false) {
          validationWarnings.push('报告保存失败（将使用本地缓存）')
        }
      } else if (report?.status === 'reject') {
        validationStatus = 'reject'
        validationErrors = report.errors || []
        packingReports.delete(date)
      }
    } catch (error) {
      console.error('Packing parse failed', error)
      validationStatus = 'reject'
      validationErrors = ['打包文件解析失败']
    }
  }

  const record = {
    dateKey: date,
    updated: toTime(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    validationStatus,
    validationErrors,
    validationWarnings,
  }
  ensureTypeMap(type).set(date, record)
  latestByType.set(type, record)

  await saveUploadRecord({ ...record, type })

  res.json({ ok: true, ...record, type })
})

app.delete('/api/uploads', async (req, res) => {
  const date = req.query.date
  const type = req.query.type
  if (!date || !type) {
    res.status(400).json({ ok: false, message: 'date and type are required' })
    return
  }
  if (!knownTypes.includes(type)) {
    res.status(400).json({ ok: false, message: 'type is invalid' })
    return
  }

  if (supabase) {
    try {
      await supabase.from('upload_records').delete().eq('work_date', date).eq('stage', type)
      if (type === 'sorting' || type === 'picking' || type === 'packing' || type === 'attendance') {
        await deleteReport(date, type)
      }
      if (type === 'sorting') sortingReports.delete(date)
      if (type === 'picking') pickingReports.delete(date)
      if (type === 'packing') packingReports.delete(date)
      if (type === 'attendance') attendanceReports.delete(date)
    } catch (error) {
      console.error('Delete upload failed', error)
      res.status(500).json({ ok: false, message: 'delete failed' })
      return
    }
  } else {
    ensureTypeMap(type).delete(date)
    if (type === 'sorting') sortingReports.delete(date)
    if (type === 'picking') pickingReports.delete(date)
    if (type === 'packing') packingReports.delete(date)
    if (type === 'attendance') attendanceReports.delete(date)
  }

  try {
    const dir = path.join(uploadRoot, date, type)
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  } catch (error) {
    console.warn('Failed to remove upload files', error)
  }

  if (latestByType.get(type)?.dateKey === date) {
    latestByType.delete(type)
  }

  res.json({ ok: true })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error', err)
  res.status(500).json({ ok: false, message: 'server error' })
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Upload API running on http://localhost:${port}`)
})
