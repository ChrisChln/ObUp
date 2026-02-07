import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Icon from './components/Icon'
// 简单防抖 Hook
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// 循环切换多个 badge（来回切换）
// 全局 Badge 计时器单例，避免为每行创建多个 setInterval
const BadgeTicker = (() => {
  const listeners = new Set()
  let id = null
  const start = () => {
    if (id) return
    id = setInterval(() => {
      listeners.forEach((cb) => {
        try {
          cb()
        } catch (e) {
          // ignore subscriber errors
        }
      })
    }, 2000)
  }
  return {
    subscribe(cb) {
      listeners.add(cb)
      start()
      return () => listeners.delete(cb)
    },
  }
})()

function RotatingBadges({ items = [], getTone = () => '', prefix = 'rb' }) {
  const [idx, setIdx] = useState(0)
  const dirRef = useRef(1)

  useEffect(() => {
    if (!items || items.length <= 1) {
      setIdx(0)
      return undefined
    }
    const unsub = BadgeTicker.subscribe(() => {
      setIdx((i) => {
        let next = i + dirRef.current
        if (next >= items.length) {
          dirRef.current = -1
          next = items.length - 2 >= 0 ? items.length - 2 : 0
        } else if (next < 0) {
          dirRef.current = 1
          next = 1
        }
        return next
      })
    })
    return () => {
      unsub()
      dirRef.current = 1
    }
  }, [items.length])

  const handleClick = () => {
    if (!items || items.length <= 1) return
    setIdx((i) => {
      const next = (i + 1) % items.length
      dirRef.current = next === items.length - 1 ? -1 : 1
      return next
    })
  }

  return (
    <>
      {items.map((part, i) => (
        <span
          key={`${prefix}-${i}`}
          className={`unit-tag ${getTone(part)} rotating-badge`}
          onClick={handleClick}
          style={{ display: items.length > 1 ? (i === idx ? 'inline-flex' : 'none') : 'inline-flex' }}
          role={items.length > 1 ? 'button' : undefined}
        >
          {part}
        </span>
      ))}
    </>
  )
}

const uploads = [
  {
    key: 'picking',
    title: '拣货数据',
    desc: '扫描记录与拣货时段',
  },
  {
    key: 'packing',
    title: '打包数据',
    desc: '装箱记录与操作时段',
  },
  {
    key: 'sorting',
    title: '分拨数据',
    desc: '分拨扫描与交接时段',
  },
  {
    key: 'attendance',
    title: '考勤数据',
    desc: '打卡流水自动拉取',
    auto: true,
  },
]

const whitelistRoles = ['组长', '合流', '调拨', '尾程', '异常']


const pad2 = (value) => String(value).padStart(2, '0')
const formatHours = (hours) => `${hours.toFixed(1)}h`
const toDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
const toDateLabel = (date, locale = 'zh-CN') => {
  const mm = pad2(date.getMonth() + 1)
  const dd = pad2(date.getDate())
  const yyyy = date.getFullYear()
  if (locale.startsWith('en')) {
    const enWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${mm}/${dd}/${yyyy} ${enWeek[date.getDay()]}`
  }
  const zhWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${mm}/${dd}/${yyyy} ${zhWeek[date.getDay()]}`
}

const buildDateList = (days = 7, locale = 'zh-CN') =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - index)
    return {
      key: toDateKey(date),
      label: toDateLabel(date, locale),
    }
  })

const labelFromKey = (key, locale = 'zh-CN') => {
  if (!key) return '--'
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return '--'
  return toDateLabel(date, locale)
}

const TRANSLATIONS = {
  en: {
    '出库人效看板': 'Outbound Productivity',
    '选中日期': 'Selected date',
    '今日有效工时': 'Effective hours',
    '今日产出量': 'Today output',
    '出勤工时': 'Attendance hours',
    '15 分钟以内相邻时间自动计入': 'Adjacent within 15 minutes counts',
    '考勤表统计': 'Attendance data',
    '等待考勤数据': 'Waiting for attendance',
    '数据入口设置': 'Data link settings',
    '入口名称': 'Link name',
    '完成': 'Done',
    '关闭': 'Close',
    '后续可加入中英版本切换': 'Language toggle',
    '人员明细': 'Details',
    '人员工时可视化': 'Work timeline',
    '有效工时占比': 'Effective ratio',
    '人效均值': 'Avg UPH',
    '异常提示': 'Alerts',
    '异常人员': 'Abnormal',
    '占比低于 75%': 'Ratio < 75%',
    '账号未匹配': 'No match',
    '有效工时 / 基准工时(8h)': 'Effective / baseline (8h)',
    '分拨 单 / 小时': 'Sorting units / hr',
    '拣货 单 / 小时': 'Picking units / hr',
    '每日上传': 'Daily upload',
    '日期列表': 'Dates',
    '更早日期': 'Earlier date',
    '等待上传': 'Waiting',
    '上传成功': 'Uploaded',
    '校验通过': 'Valid',
    '校验警告': 'Warning',
    '校验未通过': 'Rejected',
    '校验失败': 'Validation failed',
    '日期错误': 'Wrong date',
    '校验': 'Validation',
    '通过': 'Pass',
    '警告': 'Warn',
    '拒绝': 'Reject',
    '覆盖率': 'Coverage',
    '更新时间': 'Updated',
    '已选日期': 'Selected',
    '最近上传日期': 'Last upload',
    '归属日期': 'Work date',
    '上传中': 'Uploading',
    '上传': 'Upload',
    '上传失败': 'Upload failed',
    '上传失败，请检查后端服务是否启动。': 'Upload failed. Check backend.',
    '删除': 'Delete',
    '删除失败，请检查后端服务是否启动。': 'Delete failed. Check backend.',
    '暂无数据，请先上传并校验通过': 'No data, upload first',
    '红色为非作业时段，其它颜色按工种区分': 'Red is idle, others by stage',
    '拣货': 'Picking',
    '分拨': 'Sorting',
    '打包': 'Packing',
    '单品打包': 'Single pack',
    '多品打包': 'Multi pack',
    '单品': 'Single',
    '多品': 'Multi',
    '拣货人效': 'Picking UPH',
    '分拨人效': 'Sorting UPH',
    '单 / 小时': 'units / hr',
    '包含拣货 / 打包 / 分拨': 'Includes picking / packing / sorting',
    '拣货数据': 'Picking',
    '分拨数据': 'Sorting',
    '打包数据': 'Packing',
    '考勤数据': 'Attendance',
    '拣货+分拨+打包': 'Picking + Sorting + Packing',
    '扫描记录与拣货时段': 'Scan logs and picking time',
    '装箱记录与操作时段': 'Packing logs and operation time',
    '分拨扫描与交接时段': 'Sorting scans and handoff time',
    '签到、请假与排班': 'Check-in, leave, schedules',
    '白名单': 'Whitelist',
    '账号关联': 'Account Link',
    '设置': 'Settings',
    '人员': 'Name',
    '名字': 'Name',
    '件数': 'Units',
    '综合分': 'Composite score',
    '耗时': 'Hours',
    '时效': 'UPH',
    '全天时效': 'Day UPH',
    '件数下限': 'Min units',
    '件数（高→低）': 'Units (desc)',
    '耗时（高→低）': 'Hours (desc)',
    '时效（高→低）': 'UPH (desc)',
    '全天时效（高→低）': 'Day UPH (desc)',
    '开始工作': 'Start',
    '有效工时': 'EWH',
    '工时': 'Hours',
    '加班': 'OT',
    '工作时间占比': 'Ratio',
    '状态': 'Status',
    '待上传': 'Waiting',
    '正常': 'OK',
    '异常': 'Issue',
    '组长': 'Leader',
    '已匹配': 'Matched',
    '请选择考勤账号进行匹配': 'Please select attendance name to match',
    '系统自动匹配不可修改': 'Auto matched, cannot edit',
    '请输入白名单密码': 'Enter whitelist password',
    '搜索人员': 'Search',
    '搜索账号': 'Search account',
    '手动匹配': 'Match',
    '导出': 'Export',
    '生成日报': 'Report',
    '全部班组': 'All teams',
    '暂无人效数据': 'No efficiency data',
    '暂无数据': 'No data',
    '全部': 'All',
    '非作业': 'Idle',
    '员工': 'Employee',
    '其他': 'Other',
    '语言': 'Language',
    '中文': 'Chinese',
    '英语': 'English',
    '人员匹配': 'Match names',
    '暂无考勤数据，无法匹配。': 'No attendance data.',
    '当前没有需要匹配的姓名。': 'No names to match.',
    '选择工作账号': 'Select work account',
    '取消匹配': 'Clear match',
    '匹配全局生效': 'Matches are global',
    '匹配仅对当前日期生效': 'Matches apply to selected date only',
    '确认清空所有手动匹配？': 'Clear all matches?',
    '清空匹配': 'Clear matches',
    '输入密码后可新增/删除白名单': 'Enter password to edit whitelist',
    '输入密码': 'Password',
    '解锁': 'Unlock',
    '密码错误': 'Wrong password',
    '新增白名单姓名': 'Add whitelist name',
    '添加': 'Add',
    '添加失败': 'Add failed',
    '删除失败': 'Delete failed',
    '暂无白名单数据。': 'No whitelist data.',
    '名单来自远程数据库，不随日期变化': 'Whitelist is global',
    '合流': 'Merge',
    '调拨': 'Transfer',
    '尾程': 'Last-mile',
    '确定': 'OK',
    '无': 'None',
    '排序': 'Sort',
    '升序': 'Asc',
    '降序': 'Desc',
  },
}

const getUploadView = (key, uploadState) => {
  const record = uploadState?.[key]
  if (!record || record.status === 'waiting') {
    return {
      label: '等待上传',
      tone: 'waiting',
      updated: '--',
      dateKey: '',
      filename: '',
      validation: '',
      errors: [],
      warnings: [],
    }
  }
  if (record.status === 'error') {
    const label = record.validationStatus === 'reject' ? '校验失败' : '日期错误'
    return {
      label,
      tone: 'error',
      updated: record.updated,
      dateKey: record.dateKey,
      filename: record.originalName || record.filename || '',
      validation: record.validationStatus || '',
      errors: record.validationErrors || [],
      warnings: record.validationWarnings || [],
    }
  }
  return {
    label: '上传成功',
    tone: 'success',
    updated: record.updated,
    dateKey: record.dateKey,
    filename: record.originalName || record.filename || '',
    validation: record.validationStatus || '',
    errors: record.validationErrors || [],
    warnings: record.validationWarnings || [],
  }
}


const buildSortingKpi = (report) => {
  if (!report) return null
  const employeesCount = report.kpi?.employees ?? report.stats?.length ?? 0
  const totalEwh = report.kpi?.totalEwhHoursAll ?? 0
  const totalUnits = report.kpi?.totalUnitsAll ?? 0
  const avgUph = report.kpi?.avgUph ?? (totalEwh > 0 ? totalUnits / totalEwh : 0)
  const baseHours = employeesCount * 8
  const ratio = baseHours > 0 ? totalEwh / baseHours : 0
  const abnormalCount = (report.stats || []).filter(
    (item) => (item.totalUnits > 0 && (!item.ewhHours || item.ewhHours === 0)) || item.ewhHours > 20
  ).length
  return {
    ratio,
    avgUph,
    abnormalCount,
    totalEwh,
    totalUnits,
  }
}

const timelineHours = [
  { hour: 5, offset: 5 * 60 },
  { hour: 7, offset: 7 * 60 },
  { hour: 9, offset: 9 * 60 },
  { hour: 11, offset: 11 * 60 },
  { hour: 13, offset: 13 * 60 },
  { hour: 15, offset: 15 * 60 },
  { hour: 17, offset: 17 * 60 },
  { hour: 19, offset: 19 * 60 },
  { hour: 21, offset: 21 * 60 },
  { hour: 23, offset: 23 * 60 },
  { hour: 1, offset: 25 * 60 },
  { hour: 3, offset: 27 * 60 },
  { hour: 5, offset: 29 * 60 },
]
const dayStart = 5 * 60
const dayEnd = 29 * 60
const daySpan = dayEnd - dayStart

const mergeIntervals = (intervals) => {
  if (!intervals.length) return []
  const sorted = [...intervals].sort((a, b) => a.start - b.start)
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

const buildAttendanceWindowMap = (attendanceReport, nameMap) => {
  const map = new Map()
  if (!attendanceReport?.segments) return map

  const addSegments = (key, segs) => {
    if (!key || !segs?.length) return
    const list = map.get(key) || []
    segs.forEach((seg) => {
      if (seg?.start && seg?.end) list.push({ start: seg.start, end: seg.end })
    })
    map.set(key, list)
  }

  Object.entries(attendanceReport.segments).forEach(([operator, segs]) => {
    const key = normalizeName(operator)
    if (!key) return
    const onlyAttendance = (segs || []).filter((seg) => seg.type === 'attendance')
    addSegments(key, onlyAttendance)
  })

  Object.entries(nameMap || {}).forEach(([att, work]) => {
    const attKey = normalizeName(att)
    const workKey = normalizeWorkKey(work)
    if (!attKey || !workKey) return
    const segs = map.get(attKey)
    if (!segs?.length) return
    addSegments(workKey, segs)
  })

  map.forEach((list, key) => {
    const merged = mergeIntervals(
      list
        .map((seg) => ({
          start: new Date(seg.start).getTime(),
          end: new Date(seg.end).getTime(),
        }))
        .filter((seg) => Number.isFinite(seg.start) && Number.isFinite(seg.end) && seg.end > seg.start)
    )
    map.set(
      key,
      merged.map((seg) => ({ start: seg.start, end: seg.end }))
    )
  })

  return map
}

const buildTimelineRowsFromReport = (report, attendanceWindowMap) => {
  if (!report?.stats?.length) return []
  const base = new Date(report.meta.windowStart)
  const baseMs = base.getTime()
  const stageType =
    report.meta.stage === 'picking'
      ? 'picking'
      : report.meta.stage === 'sorting'
        ? 'sorting'
        : report.meta.stage === 'packing'
          ? 'packing'
          : 'sorting'
  const mergeSegments = (segments, gapMinutes = 15) => {
    if (!segments.length) return []
    const sorted = [...segments].sort((a, b) => a.start - b.start)
    const merged = []
    sorted.forEach((seg) => {
      if (!merged.length) {
        merged.push({ ...seg })
        return
      }
      const last = merged[merged.length - 1]
      if (seg.type === last.type && seg.start - last.end <= gapMinutes) {
        last.end = Math.max(last.end, seg.end)
        if (typeof seg.units === 'number') {
          const baseUnits = typeof last.units === 'number' ? last.units : 0
          last.units = baseUnits + seg.units
        }
      } else {
        merged.push({ ...seg })
      }
    })

    const output = []
    for (let i = 0; i < merged.length; i += 1) {
      const seg = merged[i]
      const isShortIdle = seg.type === 'idle' && seg.end - seg.start <= gapMinutes
      const prev = output[output.length - 1]
      const next = merged[i + 1]
      if (isShortIdle && prev && next && prev.type !== 'idle' && next.type !== 'idle') {
        prev.end = Math.max(prev.end, seg.end)
        continue
      }
      if (
        prev &&
        prev.type !== 'idle' &&
        seg.type !== 'idle' &&
        seg.start - prev.end <= gapMinutes &&
        prev.end < seg.start
      ) {
        prev.end = seg.start
      }
      output.push({ ...seg })
    }
    const finalOut = []
    output.forEach((seg) => {
      if (!finalOut.length) {
        finalOut.push({ ...seg })
        return
      }
      const last = finalOut[finalOut.length - 1]
      if (seg.type === last.type && seg.start - last.end <= gapMinutes) {
        last.end = Math.max(last.end, seg.end)
      } else {
        finalOut.push({ ...seg })
      }
    })
    return finalOut
  }

  return report.stats.map((stat) => {
    const segs = report.segments?.[stat.operator] || []
    const segments = segs.map((seg) => {
      const startMs = new Date(seg.start).getTime()
      const endMs = new Date(seg.end).getTime()
      const startMin = dayStart + Math.max(0, Math.floor((startMs - baseMs) / 60000))
      const endMin = dayStart + Math.max(0, Math.ceil((endMs - baseMs) / 60000))
      const stage =
        seg.type === 'picking' || seg.type === 'sorting' || seg.type === 'packing'
          ? seg.type
          : seg.type === 'idle'
            ? 'idle'
            : stageType
      const packingType =
        stage === 'packing'
          ? seg.category === 'single'
            ? 'packing-single'
            : seg.category === 'multi'
              ? 'packing-multi'
              : 'packing'
          : null
      const directType =
        seg.type === 'picking' || seg.type === 'sorting' || seg.type === 'packing'
          ? seg.type
          : null
      return {
        start: startMin,
        end: endMin,
        stage: stage,
        type:
          packingType ||
          directType ||
          (seg.type === 'work' ? stageType : 'idle'),
        units: typeof seg.units === 'number' ? seg.units : null,
      }
    })
    const merged = mergeSegments(segments, 15)
    const key = normalizeWorkKey(stat.operator) || normalizeName(stat.operator)
    const windowsRaw = key ? attendanceWindowMap?.get(key) : null
    const windows = windowsRaw
      ? mergeIntervals(
          windowsRaw
            .map((seg) => ({
              start: dayStart + Math.max(0, Math.floor((seg.start - baseMs) / 60000)),
              end: dayStart + Math.max(0, Math.ceil((seg.end - baseMs) / 60000)),
            }))
            .filter((seg) => seg.end > seg.start)
        )
      : []
    const applyAttendanceWindows = (list) => {
      if (!windows.length) return list
      const output = []
      list.forEach((seg) => {
        if (seg.type !== 'idle') {
          output.push(seg)
          return
        }
        let cursor = seg.start
        windows.forEach((win) => {
          if (win.end <= cursor || win.start >= seg.end) return
          const start = Math.max(cursor, win.start)
          const end = Math.min(seg.end, win.end)
          if (start > cursor) {
            output.push({ ...seg, start: cursor, end: start })
          }
          if (end > start) {
            output.push({
              ...seg,
              start,
              end,
              stage: 'attendance',
              type: 'attendance-idle',
              units: null,
            })
          }
          cursor = end
        })
        if (cursor < seg.end) {
          output.push({ ...seg, start: cursor, end: seg.end })
        }
      })
      return output
    }
    const enriched = applyAttendanceWindows(merged)
    const unitsByStage = {
      picking:
        stat.pickingUnits ??
        (report.meta.stage === 'picking' ? stat.totalUnits : 0),
      sorting:
        stat.sortingUnits ??
        (report.meta.stage === 'sorting' ? stat.totalUnits : 0),
      packing:
        stat.packingUnits ??
        (report.meta.stage === 'packing' ? stat.totalUnits : 0),
      packingSingle: stat.packingSingleUnits ?? 0,
      packingMulti: stat.packingMultiUnits ?? 0,
    }
    return {
      name: stat.operator,
      team: `EWH ${stat.ewhHours.toFixed(2)}h · 件数 ${stat.totalUnits}`,
      segments: enriched,
      unitsByStage,
    }
  })
}

const mergeWorkSegments = (segments) => {
  const sorted = segments
    .map((seg) => ({ start: new Date(seg.start).getTime(), end: new Date(seg.end).getTime(), type: seg.type }))
    .filter((seg) => seg.end > seg.start)
    .sort((a, b) => a.start - b.start)
  if (!sorted.length) return []

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

const buildCombinedReport = (pickingReport, sortingReport, packingReport) => {
  if (!pickingReport && !sortingReport && !packingReport) return null
  const baseReport = sortingReport || pickingReport || packingReport
  const windowStart = baseReport.meta.windowStart
  const windowEnd = baseReport.meta.windowEnd
  const startMs = new Date(windowStart).getTime()
  const endMs = new Date(windowEnd).getTime()

  const byOperator = new Map()
  const addStats = (report, stage) => {
    if (!report?.stats?.length) return
    report.stats.forEach((stat) => {
      if (!byOperator.has(stat.operator)) {
        byOperator.set(stat.operator, {
          operator: stat.operator,
          pickingUnits: 0,
          sortingUnits: 0,
          packingUnits: 0,
          pickingSegments: [],
          sortingSegments: [],
          packingSegments: [],
        })
      }
      const entry = byOperator.get(stat.operator)
      if (stage === 'picking') entry.pickingUnits += Number(stat.totalUnits || 0)
      if (stage === 'sorting') entry.sortingUnits += Number(stat.totalUnits || 0)
      if (stage === 'packing') entry.packingUnits += Number(stat.totalUnits || 0)
      const segs = report.segments?.[stat.operator] || []
      const mapped = segs
        .filter((seg) => seg.type === 'work')
        .map((seg) => ({
          ...seg,
          type: stage,
          category: seg.category || null,
        }))
      if (stage === 'picking') entry.pickingSegments.push(...mapped)
      if (stage === 'sorting') entry.sortingSegments.push(...mapped)
      if (stage === 'packing') entry.packingSegments.push(...mapped)
    })
  }

  addStats(pickingReport, 'picking')
  addStats(sortingReport, 'sorting')
  addStats(packingReport, 'packing')

  const stats = []
  const segments = {}
  let totalUnitsAll = 0
  let totalEwhHoursAll = 0

  byOperator.forEach((entry, operator) => {
    const workSegments = [
      ...entry.pickingSegments,
      ...entry.sortingSegments,
      ...entry.packingSegments,
    ]
    const mergedWork = mergeWorkSegments(workSegments)
    const idleSegments = []
    let cursor = startMs
    mergedWork.forEach((seg) => {
      if (seg.start > cursor) idleSegments.push({ start: new Date(cursor).toISOString(), end: new Date(seg.start).toISOString(), type: 'idle' })
      cursor = Math.max(cursor, seg.end)
    })
    if (cursor < endMs) {
      idleSegments.push({ start: new Date(cursor).toISOString(), end: new Date(endMs).toISOString(), type: 'idle' })
    }

    const ewhHours = mergedWork.reduce((sum, seg) => sum + (seg.end - seg.start), 0) / 3600000
    const totalUnits = entry.pickingUnits + entry.sortingUnits + entry.packingUnits
    const uph = ewhHours > 0 ? totalUnits / ewhHours : 0

    stats.push({
      operator,
      totalUnits,
      ewhHours,
      uph,
      pickingUnits: entry.pickingUnits,
      sortingUnits: entry.sortingUnits,
      packingUnits: entry.packingUnits,
    })

    segments[operator] = [
      ...entry.pickingSegments,
      ...entry.sortingSegments,
      ...entry.packingSegments,
      ...idleSegments,
    ]

    totalUnitsAll += totalUnits
    totalEwhHoursAll += ewhHours
  })

  stats.sort((a, b) => b.totalUnits - a.totalUnits)

  const avgUph = totalEwhHoursAll > 0 ? totalUnitsAll / totalEwhHoursAll : 0
  const statusOrder = { pass: 0, warn: 1, reject: 2 }
  const statusCandidates = [pickingReport, sortingReport, packingReport]
    .map((rep) => rep?.meta?.status)
    .filter(Boolean)
  const status =
    statusCandidates.length === 0
      ? 'pass'
      : statusCandidates.reduce((acc, cur) =>
          statusOrder[cur] > statusOrder[acc] ? cur : acc
        )
  const coverageRatio = Math.min(
    pickingReport?.meta?.coverageRatio ?? 1,
    sortingReport?.meta?.coverageRatio ?? 1,
    packingReport?.meta?.coverageRatio ?? 1
  )

  return {
    meta: {
      stage: 'combined',
      workDate: baseReport.meta.workDate,
      windowStart,
      windowEnd,
      status,
      coverageRatio,
    },
    kpi: {
      employees: stats.length,
      totalUnitsAll,
      totalEwhHoursAll,
      avgUph,
    },
    stats,
    segments,
  }
}


function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('obup.lang') || 'zh')
  const t = (text) => (lang === 'en' ? TRANSLATIONS.en[text] || text : text)
  const locale = lang === 'en' ? 'en-US' : 'zh-CN'
  const dateList = buildDateList(7, locale)
  const [selectedDate, setSelectedDate] = useState(dateList[0]?.key ?? '')
  const [stageFilter, setStageFilter] = useState('all')
  const [detailStageFilter, setDetailStageFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [detailOnlyAbnormal, setDetailOnlyAbnormal] = useState(false)
  const [detailSearch, setDetailSearch] = useState('')
  const [detailSortKey, setDetailSortKey] = useState('score')
  const [detailSortDir, setDetailSortDir] = useState('desc')
  const [uploadState, setUploadState] = useState({})
  const [uploadStateByDate, setUploadStateByDate] = useState({})
  const [showDateDropdown, setShowDateDropdown] = useState(false)
  const dateBtnRef = useRef(null)
  const [sortingReport, setSortingReport] = useState(null)
  const [pickingReport, setPickingReport] = useState(null)
  const [packingReport, setPackingReport] = useState(null)
  const [attendanceReport, setAttendanceReport] = useState(null)
  const [whitelist, setWhitelist] = useState([])
  const [manualNameMap, setManualNameMap] = useState(() => {
    try {
      const raw = localStorage.getItem('obup.nameMap')
      if (raw) return JSON.parse(raw)
    } catch (error) {
      return {}
    }
    return {}
  })
  const [accountLinkMap, setAccountLinkMap] = useState({})
  const [quickLinks, setQuickLinks] = useState(() => {
    try {
      const raw = localStorage.getItem('obup.quickLinks')
      if (raw) return JSON.parse(raw)
    } catch (error) {
      return []
    }
    return [
      { label: '拣货数据源', url: '' },
      { label: '分拨数据源', url: '' },
      { label: '打包数据源', url: '' },
      { label: '考勤数据源', url: '' },
    ]
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  const [showAccountLink, setShowAccountLink] = useState(false)
  const [showWhitelist, setShowWhitelist] = useState(false)
  const [whitelistUnlocked, setWhitelistUnlocked] = useState(false)
  const [whitelistInput, setWhitelistInput] = useState('')
  const [whitelistRoleInput, setWhitelistRoleInput] = useState('组长')
  const [timelineTip, setTimelineTip] = useState({ visible: false, x: 0, y: 0, content: '' })
  const [selectedMatchName, setSelectedMatchName] = useState('')
  const [productionIndex, setProductionIndex] = useState(0)
  const [uploadingKeys, setUploadingKeys] = useState(new Set())
  const [efficiencyFilter, setEfficiencyFilter] = useState('picking')
  const [efficiencyMinUnits, setEfficiencyMinUnits] = useState('')
  const [efficiencySortKey, setEfficiencySortKey] = useState('units')
  const [timelineSearch, setTimelineSearch] = useState('')
  const fileInputs = useRef({})
  const tipRaf = useRef(null)
  const tipPending = useRef(null)
  const todayKey = dateList[0]?.key ?? ''
  const isTodaySelected = selectedDate === todayKey
  const selectedDateLabel =
    dateList.find((item) => item.key === selectedDate)?.label ?? labelFromKey(selectedDate, locale)

  useEffect(() => {
    localStorage.setItem('obup.lang', lang)
  }, [lang])
  const effectiveNameMap = useMemo(
    () => ({ ...accountLinkMap, ...manualNameMap }),
    [accountLinkMap, manualNameMap]
  )
  const combinedReport = buildCombinedReport(pickingReport, sortingReport, packingReport)
  const attendanceWindowMap = useMemo(
    () => buildAttendanceWindowMap(attendanceReport, effectiveNameMap),
    [attendanceReport, effectiveNameMap]
  )
  const reportForDetails =
    detailStageFilter === 'picking'
      ? pickingReport
      : detailStageFilter === 'sorting'
        ? sortingReport
        : detailStageFilter === 'packing'
          ? packingReport
          : combinedReport
  const stageLabelKey =
    reportForDetails?.meta?.stage === 'picking'
      ? '拣货'
      : reportForDetails?.meta?.stage === 'sorting'
        ? '分拨'
        : reportForDetails?.meta?.stage === 'packing'
          ? '打包'
          : reportForDetails?.meta?.stage === 'combined'
            ? '拣货+分拨+打包'
            : '拣货+分拨+打包'
  const stageLabel = t(stageLabelKey)
  const timelineData = combinedReport
    ? buildTimelineRowsFromReport(combinedReport, attendanceWindowMap)
    : []
  const timelineSearchKey = normalizeName(timelineSearch)
  const filteredTimeline = timelineData.filter((row) => {
    if (timelineSearchKey && !normalizeName(row.name).includes(timelineSearchKey)) {
      return false
    }
    if (stageFilter === 'all') return true
    return row.segments.some((seg) => seg.stage === stageFilter)
  })
  const groupTimelineRows = (rows) => {
    const groups = [
      { key: 'picking', label: t('拣货为主'), rows: [] },
      { key: 'sorting', label: t('分拨为主'), rows: [] },
      { key: 'packing', label: t('打包为主'), rows: [] },
      { key: 'other', label: t('其他'), rows: [] },
    ]
    rows.forEach((row) => {
      const units = row.unitsByStage || {}
      const picking = units.picking || 0
      const sorting = units.sorting || 0
      const packing = units.packing || 0
      const max = Math.max(picking, sorting, packing)
      const key =
        max === 0
          ? 'other'
          : max === picking
            ? 'picking'
            : max === sorting
              ? 'sorting'
              : 'packing'
      const group = groups.find((item) => item.key === key) || groups[3]
      group.rows.push(row)
    })
    return groups.filter((group) => group.rows.length)
  }
  const groupedTimeline = groupTimelineRows(filteredTimeline)
  const pickingKpi = buildSortingKpi(pickingReport)
  const sortingKpi = buildSortingKpi(sortingReport)
  const packingKpi = buildSortingKpi(packingReport)
  const activeKpi =
    detailStageFilter === 'picking'
      ? pickingKpi
      : detailStageFilter === 'sorting'
        ? sortingKpi
        : detailStageFilter === 'packing'
          ? packingKpi
        : null
  const sortingMetaText = reportForDetails
    ? `${stageLabel}${t('校验')}: ${
        reportForDetails.meta.status === 'pass'
          ? t('通过')
          : reportForDetails.meta.status === 'warn'
            ? t('警告')
            : t('拒绝')
      } · ${t('覆盖率')} ${Math.round(reportForDetails.meta.coverageRatio * 100)}%`
    : t('红色为非作业时段，其它颜色按工种区分')
  const detailRows = useMemo(
    () =>
      buildDetailRows(
        combinedReport,
        pickingReport,
        sortingReport,
        packingReport,
        attendanceReport,
        effectiveNameMap
      ),
    [combinedReport, pickingReport, sortingReport, packingReport, attendanceReport, effectiveNameMap]
  )
  const detailTeams = useMemo(
    () => Array.from(new Set(detailRows.flatMap((row) => Array.from(row.groups)))),
    [detailRows]
  )
  const debouncedDetailSearch = useDebouncedValue(detailSearch, 250)
  const detailSearchNormalized = useMemo(() => normalizeName(debouncedDetailSearch), [debouncedDetailSearch])
  const detailSearchWorkKey = useMemo(() => normalizeWorkKey(debouncedDetailSearch), [debouncedDetailSearch])
  const [isFiltering, setIsFiltering] = useState(false)

  useEffect(() => {
    // 显示过滤 loading 状态，等防抖结束再隐藏（不自动滚动）
    setIsFiltering(true)
    const id = setTimeout(() => {
      setIsFiltering(false)
    }, 260)
    return () => clearTimeout(id)
  }, [debouncedDetailSearch, detailStageFilter, teamFilter, detailOnlyAbnormal])
  const whitelistRoleMap = useMemo(() => {
    const map = new Map()
    whitelist.forEach((entry) => {
      if (!entry) return
      const name = typeof entry === 'string' ? entry : entry.name
      const role = typeof entry === 'string' ? '组长' : entry.role || '组长'
      const key = normalizeName(name)
      if (key) map.set(key, role)
    })
    return map
  }, [whitelist])
  const getWhitelistRole = (person) => {
    const key = normalizeName(person?.attendanceName || person?.name)
    return key ? whitelistRoleMap.get(key) || '' : ''
  }
  const isWhitelistExempt = (role) => Boolean(role && role !== '异常')
  const startTimeMaps = useMemo(
    () => ({
      picking: buildStartTimeMap(pickingReport, effectiveNameMap, 'picking'),
      sorting: buildStartTimeMap(sortingReport, effectiveNameMap, 'sorting'),
      packing: buildStartTimeMap(packingReport, effectiveNameMap, 'packing'),
      all: buildStartTimeMap(combinedReport, effectiveNameMap, 'all'),
    }),
    [pickingReport, sortingReport, packingReport, combinedReport, effectiveNameMap]
  )
  const hasAttendanceData = (attendanceReport?.stats || []).length > 0
  const attendanceNames = useMemo(
    () => Array.from(
      new Set((attendanceReport?.stats || []).map((item) => item.operator).filter(Boolean))
    ),
    [attendanceReport]
  )
  const attendanceNameSet = useMemo(
    () => new Set(attendanceNames.map((name) => normalizeName(name)).filter(Boolean)),
    [attendanceNames]
  )
  const detailAbnormal = useMemo(
    () =>
      detailRows.reduce(
        (acc, row) => {
          if (!row.attendanceName) return acc
          if (!attendanceNameSet.has(normalizeName(row.attendanceName))) return acc
          const ratio =
            row.attendanceHours > 0 ? (row.ewhHours / row.attendanceHours) * 100 : null
          const role = getWhitelistRole(row)
          const forcedIssue = role === '异常'
          if (isWhitelistExempt(role)) return acc
          const matchIssue =
            hasAttendanceData && (!row.attendanceMatched || row.attendanceHours <= 0)
          const ratioIssue = ratio !== null && (ratio < 75 || ratio > 100)
          if (forcedIssue) acc.total += 1
          if (matchIssue) acc.unmatched += 1
          if (ratioIssue) acc.lowRatio += 1
          if (matchIssue || ratioIssue) acc.total += 1
          return acc
        },
        { total: 0, unmatched: 0, lowRatio: 0 }
      ),
    [detailRows, attendanceNameSet, hasAttendanceData, whitelistRoleMap]
  )
  const workNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...(pickingReport?.stats || []).map((stat) => stat.operator),
          ...(sortingReport?.stats || []).map((stat) => stat.operator),
          ...(packingReport?.stats || []).map((stat) => stat.operator),
        ])
      ).filter(Boolean),
    [pickingReport, sortingReport, packingReport]
  )
  const workKeySet = useMemo(
    () => new Set(workNames.map((name) => normalizeWorkKey(name)).filter(Boolean)),
    [workNames]
  )
  const mappedTargets = useMemo(
    () =>
      new Set(Object.values(effectiveNameMap).map((name) => normalizeWorkKey(name)).filter(Boolean)),
    [effectiveNameMap]
  )
  const usedWorkKeySet = useMemo(() => {
    const set = new Set(mappedTargets)
    detailRows.forEach((row) => {
      if (!row.attendanceMatched) return
      if (row.workKey) set.add(row.workKey)
      if (row.sources && row.sources.size) {
        row.sources.forEach((source) => {
          const key = normalizeWorkKey(source)
          if (key) set.add(key)
        })
      }
    })
    return set
  }, [mappedTargets, detailRows])
  const availableWorkOptions = useMemo(
    () =>
      workNames.filter((att) => {
        const key = normalizeWorkKey(att)
        return key && !usedWorkKeySet.has(key)
      }),
    [workNames, usedWorkKeySet]
  )
  const autoMatchedNameSet = useMemo(() => {
    const set = new Set()
    detailRows.forEach((row) => {
      if (!row.attendanceName) return
      if (effectiveNameMap[row.attendanceName]) return
      if (row.attendanceMatched) set.add(row.attendanceName)
    })
    return set
  }, [detailRows, effectiveNameMap])
  const unmatchedNames = useMemo(
    () =>
      attendanceNames.filter((name) => {
        if (effectiveNameMap[name]) return false
        const key = normalizeName(name)
        return key && !workKeySet.has(key)
      }),
    [attendanceNames, effectiveNameMap, workKeySet]
  )
  const matchPanelNames = useMemo(
    () => [...unmatchedNames].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')),
    [unmatchedNames]
  )
  const accountLinkPanelNames = useMemo(() => {
    const linked = attendanceNames.filter((name) => Boolean(accountLinkMap[name]))
    const unresolved = attendanceNames.filter((name) => {
      if (accountLinkMap[name]) return false
      const key = normalizeName(name)
      return key && !workKeySet.has(key)
    })
    return Array.from(new Set([...unresolved, ...linked])).sort((a, b) =>
      a.localeCompare(b, 'zh-Hans-CN')
    )
  }, [attendanceNames, accountLinkMap, workKeySet])
  const filteredDetailRows = useMemo(
    () =>
      detailRows.filter((person) => {
        if (detailOnlyAbnormal) {
          if (!person.attendanceName) return false
          if (!attendanceNameSet.has(normalizeName(person.attendanceName))) return false
          const ratio =
            person.attendanceHours > 0
              ? (person.ewhHours / person.attendanceHours) * 100
              : null
          const role = getWhitelistRole(person)
          const forcedIssue = role === '异常'
          const exempt = isWhitelistExempt(role)
          const matchIssue =
            !exempt &&
            hasAttendanceData &&
            (!person.attendanceMatched || person.attendanceHours <= 0)
          const ratioIssue = !exempt && ratio !== null && (ratio < 75 || ratio > 100)
          if (!(forcedIssue || matchIssue || ratioIssue)) return false
        }
        if (detailStageFilter === 'picking' && !(person.groups.has('拣货') || person.hasPicked)) return false
        if (detailStageFilter === 'sorting' && !(person.groups.has('分拨') || person.hasSorted)) return false
        if (detailStageFilter === 'packing' && !(person.groups.has('打包') || person.hasPacked)) return false
        if (teamFilter !== 'all' && !person.groups.has(teamFilter)) return false
        if (detailSearchNormalized) {
          const nameKey = normalizeName(person.name)
          const workKeyMatch =
            detailSearchWorkKey && person.workKey && person.workKey.includes(detailSearchWorkKey)
          if (!nameKey.includes(detailSearchNormalized) && !workKeyMatch) return false
        }
        return true
      }),
    [detailRows, detailOnlyAbnormal, attendanceNameSet, whitelistRoleMap, hasAttendanceData, detailStageFilter, teamFilter, detailSearchNormalized]
  )

  const sortedDetailRows = useMemo(() => {
    const rows = filteredDetailRows.slice()
    const dir = detailSortDir === 'asc' ? 1 : -1

    const startMap =
      detailStageFilter === 'picking'
        ? startTimeMaps.picking
        : detailStageFilter === 'sorting'
          ? startTimeMaps.sorting
          : detailStageFilter === 'packing'
            ? startTimeMaps.packing
            : startTimeMaps.all

    const getStartMs = (person) => {
      const startKey = person.attendanceName
        ? normalizeName(person.attendanceName)
        : person.workKey
          ? person.workKey
          : person.sources && person.sources.size
            ? normalizeWorkKey(Array.from(person.sources)[0])
            : normalizeName(person.name)
      const ms = startMap.get(startKey)
      return Number.isFinite(ms) ? ms : null
    }

    const getUnits = (person) => {
      if (detailStageFilter === 'picking') return Number(person.pickingUnits || 0)
      if (detailStageFilter === 'sorting') return Number(person.sortingUnits || 0)
      if (detailStageFilter === 'packing')
        return Number(person.packingSingleUnits || 0) + Number(person.packingMultiUnits || 0)
      return (
        Number(person.pickingUnits || 0) +
        Number(person.sortingUnits || 0) +
        Number(person.packingSingleUnits || 0) +
        Number(person.packingMultiUnits || 0)
      )
    }

    const getEwh = (person) => {
      if (detailStageFilter === 'picking') return Number(person.pickingEwhHours || 0)
      if (detailStageFilter === 'sorting') return Number(person.sortingEwhHours || 0)
      if (detailStageFilter === 'packing')
        return (
          Number(person.packingSingleEwhHours || 0) + Number(person.packingMultiEwhHours || 0)
        )
      return Number(person.ewhHours || 0)
    }

    const getEff = (person) => {
      const units = getUnits(person)
      const ewh = getEwh(person)
      return ewh > 0 ? units / ewh : null
    }

    const getRatio = (person) =>
      person.attendanceHours > 0
        ? (Number(person.ewhHours || 0) / Number(person.attendanceHours || 0)) * 100
        : null

    const getOvertime = (person) => {
      const h = Number(person.attendanceHours || 0)
      if (!h) return null
      return h > 8 ? h - 8 : 0
    }

    const getVal = (person) => {
      switch (detailSortKey) {
        case 'name':
          return person.name || ''
        case 'start':
          return getStartMs(person)
        case 'ewh':
          return Number(person.ewhHours || 0)
        case 'hours':
          return Number(person.attendanceHours || 0)
        case 'ot':
          return getOvertime(person)
        case 'units':
          return getUnits(person)
        case 'score':
          return typeof person.compositeScore === 'number' ? person.compositeScore : null
        case 'eff':
          return getEff(person)
        case 'ratio':
          return getRatio(person)
        default:
          return null
      }
    }

    rows.sort((a, b) => {
      const av = getVal(a)
      const bv = getVal(b)

      if (detailSortKey === 'name') {
        return String(av).localeCompare(String(bv), locale, { sensitivity: 'base' }) * dir
      }

      const an = av == null ? Number.NEGATIVE_INFINITY : Number(av)
      const bn = bv == null ? Number.NEGATIVE_INFINITY : Number(bv)
      if (an === bn) {
        return String(a.name || '').localeCompare(String(b.name || ''), locale, {
          sensitivity: 'base',
        })
      }
      return (an - bn) * dir
    })

    return rows
  }, [filteredDetailRows, detailSortKey, detailSortDir, detailStageFilter, startTimeMaps, locale])

  const fetchUploadState = async (dateKey) => {
    if (!dateKey) return
    try {
      const response = await fetch(`/api/uploads?date=${dateKey}`)
      if (!response.ok) throw new Error('request failed')
      const data = await response.json()
      setUploadState(data)
      setUploadStateByDate((prev) => ({ ...prev, [dateKey]: data }))
    } catch (error) {
      setUploadState({})
    }
  }

  const fetchUploadStateForDate = async (dateKey) => {
    if (!dateKey) return
    try {
      const response = await fetch(`/api/uploads?date=${dateKey}`)
      if (!response.ok) throw new Error('request failed')
      const data = await response.json()
      setUploadStateByDate((prev) => ({ ...prev, [dateKey]: data }))
    } catch (error) {
      setUploadStateByDate((prev) => ({ ...prev, [dateKey]: {} }))
    }
  }

  const fetchSortingReport = async (dateKey) => {
    if (!dateKey) return
    try {
      const response = await fetch(`/api/reports/sorting?date=${dateKey}`)
      if (!response.ok) {
        setSortingReport(null)
        return
      }
      const data = await response.json()
      setSortingReport(data.report || null)
    } catch (error) {
      setSortingReport(null)
    }
  }

  const fetchPickingReport = async (dateKey) => {
    if (!dateKey) return
    try {
      const response = await fetch(`/api/reports/picking?date=${dateKey}`)
      if (!response.ok) {
        setPickingReport(null)
        return
      }
      const data = await response.json()
      setPickingReport(data.report || null)
    } catch (error) {
      setPickingReport(null)
    }
  }

  const fetchPackingReport = async (dateKey) => {
    if (!dateKey) return
    try {
      const response = await fetch(`/api/reports/packing?date=${dateKey}`)
      if (!response.ok) {
        setPackingReport(null)
        return
      }
      const data = await response.json()
      setPackingReport(data.report || null)
    } catch (error) {
      setPackingReport(null)
    }
  }

  // fetch upload states for visible date list (cache per date)
  useEffect(() => {
    if (!dateList || !dateList.length) return
    dateList.forEach((d) => {
      if (!uploadStateByDate[d.key]) {
        fetchUploadStateForDate(d.key)
      }
    })
  }, [dateList])

  const getDateTone = (dateKey) => {
    if (!dateKey) return 'waiting'
    const stateForDate = uploadStateByDate[dateKey] || {}
    const keys = uploads.filter((u) => !u.auto).map((u) => u.key)
    let tone = 'waiting'
    if (stateForDate && Object.keys(stateForDate).length) {
      const anyError = keys.some((k) => stateForDate[k]?.status === 'error')
      if (anyError) tone = 'error'
      else {
        const successCount = keys.filter((k) => stateForDate[k] && stateForDate[k].status && stateForDate[k].status !== 'waiting').length
        if (successCount === keys.length) tone = 'success'
        else if (successCount > 0) tone = 'partial'
        else tone = 'waiting'
      }
    }
    return tone
  }

  // close dropdown on outside click
  useEffect(() => {
    if (!showDateDropdown) return undefined
    const onDocClick = (e) => {
      if (!dateBtnRef.current) return
      if (!dateBtnRef.current.contains(e.target)) setShowDateDropdown(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showDateDropdown])

  const fetchAttendanceReport = async (dateKey) => {
    if (!dateKey) return
    try {
      const response = await fetch(`/api/reports/attendance?date=${dateKey}`)
      if (!response.ok) {
        setAttendanceReport(null)
        return
      }
      const data = await response.json()
      setAttendanceReport(data.report || null)
    } catch (error) {
      setAttendanceReport(null)
    }
  }

  useEffect(() => {
    if (!isTodaySelected) return undefined
    const refreshMs = 2 * 60 * 1000
    const id = setInterval(() => {
      fetchAttendanceReport(selectedDate)
    }, refreshMs)
    return () => clearInterval(id)
  }, [isTodaySelected, selectedDate])

  useEffect(() => {
    fetchUploadState(selectedDate)
    fetchSortingReport(selectedDate)
    fetchPickingReport(selectedDate)
    fetchPackingReport(selectedDate)
    fetchAttendanceReport(selectedDate)
  }, [selectedDate])

  const efficiencyRows = detailRows
    .filter((row) => {
      if (efficiencyFilter === 'picking' && !row.groups.has('拣货')) return false
      if (efficiencyFilter === 'sorting' && !row.groups.has('分拨')) return false
      if (efficiencyFilter === 'packing-single' && row.packingSingleUnits <= 0) return false
      if (efficiencyFilter === 'packing-multi' && row.packingMultiUnits <= 0) return false
      return row.ewhHours > 0 || row.attendanceHours > 0
    })
    .map((row) => {
      const units =
        efficiencyFilter === 'picking'
          ? row.pickingUnits
          : efficiencyFilter === 'sorting'
            ? row.sortingUnits
            : efficiencyFilter === 'packing-single'
              ? row.packingSingleUnits
              : efficiencyFilter === 'packing-multi'
                ? row.packingMultiUnits
                : row.pickingUnits + row.sortingUnits + row.packingSingleUnits + row.packingMultiUnits
      const hours =
        efficiencyFilter === 'picking'
          ? row.pickingEwhHours
          : efficiencyFilter === 'sorting'
            ? row.sortingEwhHours
            : efficiencyFilter === 'packing-single'
              ? row.packingSingleEwhHours
              : efficiencyFilter === 'packing-multi'
                ? row.packingMultiEwhHours
                : row.ewhHours
      const eff = hours > 0 ? units / hours : null
      const dayEff = row.attendanceHours > 0 ? units / row.attendanceHours : null
      return {
        name: row.name,
        units,
        hours,
        eff,
        dayEff,
      }
    })
    .filter((row) => {
      const min = Number(efficiencyMinUnits)
      if (!efficiencyMinUnits || Number.isNaN(min)) return true
      return row.units >= min
    })
    .sort((a, b) => {
      if (efficiencySortKey === 'units') return (b.units || 0) - (a.units || 0)
      if (efficiencySortKey === 'hours') return (b.hours || 0) - (a.hours || 0)
      if (efficiencySortKey === 'eff') return (b.eff || 0) - (a.eff || 0)
      if (efficiencySortKey === 'dayEff') return (b.dayEff || 0) - (a.dayEff || 0)
      return 0
    })

  const minUnitsValue = Number(efficiencyMinUnits)
  const minUnitsLimit = !efficiencyMinUnits || Number.isNaN(minUnitsValue) ? null : minUnitsValue
  const calcAvgUph = (rows, getUnits, getHours) => {
    const totals = rows.reduce(
      (acc, row) => {
        const units = getUnits(row) || 0
        const hours = getHours(row) || 0
        if (minUnitsLimit !== null && units < minUnitsLimit) return acc
        acc.units += units
        acc.hours += hours
        return acc
      },
      { units: 0, hours: 0 }
    )
    return totals.hours > 0 ? totals.units / totals.hours : null
  }

  const pickingMini = calcAvgUph(
    detailRows,
    (row) => row.pickingUnits,
    (row) => row.pickingEwhHours
  )
  const sortingMini = calcAvgUph(
    detailRows,
    (row) => row.sortingUnits,
    (row) => row.sortingEwhHours
  )
  const packingSingleMini = calcAvgUph(
    detailRows,
    (row) => row.packingSingleUnits,
    (row) => row.packingSingleEwhHours
  )
  const packingMultiMini = calcAvgUph(
    detailRows,
    (row) => row.packingMultiUnits,
    (row) => row.packingMultiEwhHours
  )

  const productionStages = [
    { key: 'packing', label: '打包数据', value: packingReport?.kpi?.totalUnitsAll },
    { key: 'picking', label: '拣货数据', value: pickingReport?.kpi?.totalUnitsAll },
    { key: 'sorting', label: '分拨数据', value: sortingReport?.kpi?.totalUnitsAll },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProductionIndex((prev) => (prev + 1) % productionStages.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [productionStages.length])

  useEffect(() => {
    if (stageFilter !== 'all') return
    if (sortingReport && !pickingReport && !packingReport) {
      setStageFilter('sorting')
      return
    }
    if (pickingReport && !sortingReport && !packingReport) {
      setStageFilter('picking')
      return
    }
    if (packingReport && !sortingReport && !pickingReport) {
      setStageFilter('packing')
    }
  }, [sortingReport, pickingReport, packingReport, stageFilter])

  useEffect(() => {
    if (detailStageFilter !== 'all') return
    if (sortingReport && !pickingReport && !packingReport) {
      setDetailStageFilter('sorting')
      return
    }
    if (pickingReport && !sortingReport && !packingReport) {
      setDetailStageFilter('picking')
      return
    }
    if (packingReport && !sortingReport && !pickingReport) {
      setDetailStageFilter('packing')
    }
  }, [sortingReport, pickingReport, packingReport, detailStageFilter])

  useEffect(() => {
    if (teamFilter !== 'all') return
    if (sortingReport && !pickingReport && !packingReport) {
      setTeamFilter('分拨')
      return
    }
    if (pickingReport && !sortingReport && !packingReport) {
      setTeamFilter('拣货')
      return
    }
    if (packingReport && !sortingReport && !pickingReport) {
      setTeamFilter('打包')
    }
  }, [sortingReport, pickingReport, packingReport, teamFilter])

  useEffect(() => {
    setTeamFilter('all')
    setDetailSearch('')
  }, [detailStageFilter, selectedDate])

  useEffect(() => {
    localStorage.setItem('obup.quickLinks', JSON.stringify(quickLinks))
  }, [quickLinks])

  useEffect(() => {
    localStorage.setItem('obup.lang', lang)
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
  }, [lang])

  useEffect(() => {
    localStorage.setItem('obup.nameMap', JSON.stringify(manualNameMap))
  }, [manualNameMap])

  useEffect(() => {
    const loadAccountLinks = async () => {
      try {
        const response = await fetch('/api/account-links')
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.links)) {
          const map = {}
          data.links.forEach((row) => {
            if (row?.source_name && row?.target_name) map[row.source_name] = row.target_name
          })
          setAccountLinkMap(map)
        }
      } catch (error) {
        // ignore
      }
    }
    loadAccountLinks()
  }, [])

  useEffect(() => {
    const loadManualMatches = async () => {
      if (!selectedDate) {
        setManualNameMap({})
        return
      }
      try {
        const response = await fetch(`/api/name-matches?date=${selectedDate}`)
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.matches)) {
          const map = {}
          data.matches.forEach((row) => {
            if (row?.source_name && row?.target_name) map[row.source_name] = row.target_name
          })
          setManualNameMap(map)
        } else {
          setManualNameMap({})
        }
      } catch (error) {
        setManualNameMap({})
      }
    }
    loadManualMatches()
  }, [selectedDate])

  const showTimelineTip = (event, seg, row) => {
    const label =
      seg.stage === 'attendance'
        ? '考勤内未作业'
        : seg.stage === 'picking'
        ? '拣货'
        : seg.stage === 'sorting'
          ? '分拨'
          : seg.stage === 'packing'
            ? seg.type === 'packing-single'
              ? '打包(单品)'
              : seg.type === 'packing-multi'
                ? '打包(多品)'
                : '打包'
            : '非作业'
    const toTime = (minutes) => {
      const total = Math.round(minutes)
      const hh = Math.floor((total % 1440) / 60)
      const mm = total % 60
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
    }
    const start = toTime(seg.start)
    const end = toTime(seg.end)
    const duration = Math.max(0, Math.round(seg.end - seg.start))
    const units =
      typeof seg.units === 'number'
        ? seg.units
        : seg.stage === 'picking'
          ? row.unitsByStage?.picking
          : seg.stage === 'sorting'
            ? row.unitsByStage?.sorting
            : seg.stage === 'packing'
              ? seg.type === 'packing-single'
                ? row.unitsByStage?.packingSingle
                : seg.type === 'packing-multi'
                  ? row.unitsByStage?.packingMulti
                  : row.unitsByStage?.packing
              : null
    const unitText =
      seg.stage === 'attendance'
        ? ''
        : units || units === 0
          ? ` · 件数 ${units}`
          : ''
    const durationText = ` · ${duration}分钟`
    const content = `${label} ${start} → ${end}${durationText}${seg.stage === 'idle' ? '' : unitText}`
    const offset = 12
    const maxWidth = 260
    const maxHeight = 80
    const x = Math.min(event.clientX + offset, window.innerWidth - maxWidth)
    const y = Math.min(event.clientY + offset, window.innerHeight - maxHeight)
    tipPending.current = { x, y, content }
    if (tipRaf.current) return
    tipRaf.current = requestAnimationFrame(() => {
      if (tipPending.current) {
        setTimelineTip({ visible: true, ...tipPending.current })
      }
      tipRaf.current = null
    })
  }

  const hideTimelineTip = () => {
    if (tipRaf.current) {
      cancelAnimationFrame(tipRaf.current)
      tipRaf.current = null
    }
    tipPending.current = null
    setTimelineTip((prev) => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    const handleScroll = () => hideTimelineTip()
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [])

  useEffect(() => {
    const loadWhitelist = async () => {
      try {
        const response = await fetch('/api/whitelist')
        if (!response.ok) return
        const data = await response.json()
        setWhitelist(Array.isArray(data.whitelist) ? data.whitelist : [])
      } catch (error) {
        setWhitelist([])
      }
    }
    loadWhitelist()
  }, [])

  const refreshWhitelist = async () => {
    try {
      const response = await fetch('/api/whitelist')
      if (!response.ok) return
      const data = await response.json()
      setWhitelist(Array.isArray(data.whitelist) ? data.whitelist : [])
    } catch (error) {
      setWhitelist([])
    }
  }

  const updateQuickLink = (index, field, value) => {
    setQuickLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const updateAccountLinkMap = async (sourceName, targetName) => {
    setAccountLinkMap((prev) => {
      const next = { ...prev }
      if (!targetName) {
        delete next[sourceName]
        return next
      }
      Object.keys(next).forEach((key) => {
        if (next[key] === targetName && key !== sourceName) {
          delete next[key]
        }
      })
      next[sourceName] = targetName
      return next
    })
    try {
      if (!targetName) {
        await fetch(`/api/account-links?sourceName=${encodeURIComponent(sourceName)}`, {
          method: 'DELETE',
        })
      } else {
        await fetch('/api/account-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceName, targetName }),
        })
      }
    } catch (error) {
      // ignore
    }
  }

  const updateNameMap = async (sourceName, targetName) => {
    setManualNameMap((prev) => {
      const next = { ...prev }
      if (!targetName) {
        delete next[sourceName]
        return next
      }
      Object.keys(next).forEach((key) => {
        if (next[key] === targetName && key !== sourceName) {
          delete next[key]
        }
      })
      next[sourceName] = targetName
      return next
    })
    try {
      if (!targetName) {
        await fetch(
          `/api/name-matches?date=${selectedDate}&sourceName=${encodeURIComponent(sourceName)}`,
          { method: 'DELETE' }
        )
      } else {
        await fetch('/api/name-matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceName, targetName, date: selectedDate }),
        })
      }
    } catch (error) {
      // ignore
    }
  }

  const updateWhitelistRole = async (name, role) => {
    if (!name) return
    if (!whitelistUnlocked) {
      const pwd = prompt(t('请输入白名单密码'))
      if (pwd !== '0402') {
        alert(t('密码错误'))
        return
      }
      setWhitelistUnlocked(true)
    }
    try {
      if (!role) {
        await fetch(`/api/whitelist?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
      } else {
        await fetch('/api/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, role }),
        })
      }
      await refreshWhitelist()
    } catch (error) {
      alert(role ? t('添加失败') : t('删除失败'))
    }
  }

  const resetManualMatches = async () => {
    const current = { ...manualNameMap }
    setManualNameMap({})
    await Promise.all(
      Object.keys(current).map((source) =>
        fetch(
          `/api/name-matches?date=${selectedDate}&sourceName=${encodeURIComponent(source)}`,
          { method: 'DELETE' }
        ).catch(() => null)
      )
    )
  }

  const resetAccountLinks = async () => {
    setAccountLinkMap({})
    try {
      await fetch('/api/account-links', { method: 'DELETE' })
    } catch (error) {
      // ignore
    }
  }

  const exportDetailExcel = async () => {
    const rows = sortedDetailRows
    if (!rows.length) {
      alert(t('暂无数据'))
      return
    }

    const startMap =
      detailStageFilter === 'picking'
        ? startTimeMaps.picking
        : detailStageFilter === 'sorting'
          ? startTimeMaps.sorting
          : detailStageFilter === 'packing'
            ? startTimeMaps.packing
            : startTimeMaps.all

    const toStartLabel = (person) => {
      const startKey = person.attendanceName
        ? normalizeName(person.attendanceName)
        : person.workKey
          ? person.workKey
          : person.sources && person.sources.size
            ? normalizeWorkKey(Array.from(person.sources)[0])
            : normalizeName(person.name)
      const startMs = startMap.get(startKey)
      return Number.isFinite(startMs)
        ? new Date(startMs).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
        : ''
    }

    const getUnitsForStage = (person) => {
      if (detailStageFilter === 'picking') return Number(person.pickingUnits || 0)
      if (detailStageFilter === 'sorting') return Number(person.sortingUnits || 0)
      if (detailStageFilter === 'packing')
        return Number(person.packingSingleUnits || 0) + Number(person.packingMultiUnits || 0)
      return (
        Number(person.pickingUnits || 0) +
        Number(person.sortingUnits || 0) +
        Number(person.packingSingleUnits || 0) +
        Number(person.packingMultiUnits || 0)
      )
    }

    const getEwhForStage = (person) => {
      if (detailStageFilter === 'picking') return Number(person.pickingEwhHours || 0)
      if (detailStageFilter === 'sorting') return Number(person.sortingEwhHours || 0)
      if (detailStageFilter === 'packing')
        return (
          Number(person.packingSingleEwhHours || 0) + Number(person.packingMultiEwhHours || 0)
        )
      return Number(person.ewhHours || 0)
    }

    const getUnitsDetail = (person) => {
      const parts = []
      if (detailStageFilter === 'picking') parts.push(`${t('拣货')}:${person.pickingUnits || 0}`)
      else if (detailStageFilter === 'sorting') parts.push(`${t('分拨')}:${person.sortingUnits || 0}`)
      else if (detailStageFilter === 'packing') {
        parts.push(`${t('单品')}:${person.packingSingleUnits || 0}`)
        parts.push(`${t('多品')}:${person.packingMultiUnits || 0}`)
      } else {
        if (person.pickingUnits) parts.push(`${t('拣货')}:${person.pickingUnits}`)
        if (person.sortingUnits) parts.push(`${t('分拨')}:${person.sortingUnits}`)
        if (person.packingSingleUnits) parts.push(`${t('单品')}:${person.packingSingleUnits}`)
        if (person.packingMultiUnits) parts.push(`${t('多品')}:${person.packingMultiUnits}`)
      }
      return parts.join('  ')
    }

    const getEffDetail = (person) => {
      const parts = []
      const pushEff = (label, units, ewh) => {
        const eff = ewh > 0 ? units / ewh : null
        if (eff == null) return
        parts.push(`${label}:${eff.toFixed(1)}`)
      }
      if (detailStageFilter === 'picking') {
        pushEff(t('拣货'), Number(person.pickingUnits || 0), Number(person.pickingEwhHours || 0))
      } else if (detailStageFilter === 'sorting') {
        pushEff(t('分拨'), Number(person.sortingUnits || 0), Number(person.sortingEwhHours || 0))
      } else if (detailStageFilter === 'packing') {
        pushEff(t('单品'), Number(person.packingSingleUnits || 0), Number(person.packingSingleEwhHours || 0))
        pushEff(t('多品'), Number(person.packingMultiUnits || 0), Number(person.packingMultiEwhHours || 0))
      } else {
        if (person.pickingUnits || person.pickingEwhHours) {
          pushEff(t('拣货'), Number(person.pickingUnits || 0), Number(person.pickingEwhHours || 0))
        }
        if (person.sortingUnits || person.sortingEwhHours) {
          pushEff(t('分拨'), Number(person.sortingUnits || 0), Number(person.sortingEwhHours || 0))
        }
        if (person.packingSingleUnits || person.packingSingleEwhHours) {
          pushEff(t('单品'), Number(person.packingSingleUnits || 0), Number(person.packingSingleEwhHours || 0))
        }
        if (person.packingMultiUnits || person.packingMultiEwhHours) {
          pushEff(t('多品'), Number(person.packingMultiUnits || 0), Number(person.packingMultiEwhHours || 0))
        }
      }
      return parts.join('  ')
    }

    const hasAttendance = (attendanceReport?.stats || []).length > 0

    const computeStatus = (person) => {
      const ratio =
        person.attendanceHours > 0 ? (person.ewhHours / person.attendanceHours) * 100 : null
      const whitelistRole = getWhitelistRole(person)
      const whitelistExempt = isWhitelistExempt(whitelistRole)
      const forcedIssue = whitelistRole === '异常'
      const matchIssue =
        !whitelistExempt &&
        hasAttendance &&
        (!person.attendanceMatched || person.attendanceHours <= 0)
      const ratioIssue = !whitelistExempt && ratio !== null && (ratio < 75 || ratio > 100)
      const waitingAttendance = !hasAttendance && person.ewhHours > 0
      const matchedByManual = person.attendanceName && effectiveNameMap[person.attendanceName]
      const hasIssue = forcedIssue || matchIssue || ratioIssue
      const label = whitelistRole
        ? t(whitelistRole)
        : waitingAttendance
          ? t('待上传')
          : hasIssue
            ? t('异常')
            : matchedByManual
              ? t('已匹配')
              : t('正常')
      return label
    }

    const headers = [
      t('人员'),
      t('开始工作'),
      t('有效工时'),
      t('工时'),
      t('加班'),
      t('件数'),
      t('综合分'),
      t('时效'),
      t('工作时间占比'),
      t('状态'),
      `${t('件数')}(${t('明细') || '明细'})`,
      `${t('时效')}(${t('明细') || '明细'})`,
    ]

    const aoa = [headers]
    rows.forEach((person) => {
      const start = toStartLabel(person)
      const ewh = Number(person.ewhHours || 0)
      const hours = Number(person.attendanceHours || 0)
      const ot = hours > 8 ? hours - 8 : hours ? 0 : ''
      const units = getUnitsForStage(person)
      const stageEwh = getEwhForStage(person)
      const eff = stageEwh > 0 ? units / stageEwh : ''
      const ratio =
        hours > 0 ? (Number(person.ewhHours || 0) / Number(person.attendanceHours || 0)) * 100 : ''
      const status = computeStatus(person)
      const score = typeof person.compositeScore === 'number' ? person.compositeScore : ''

      aoa.push([
        person.name || '',
        start,
        ewh ? Number(ewh.toFixed(2)) : '',
        hours ? Number(hours.toFixed(2)) : '',
        ot === '' ? '' : Number(Number(ot).toFixed(2)),
        units ? units : 0,
        score === '' ? '' : Number(Number(score).toFixed(2)),
        eff === '' ? '' : Number(Number(eff).toFixed(2)),
        ratio === '' ? '' : `${Number(ratio).toFixed(0)}%`,
        status,
        getUnitsDetail(person),
        getEffDetail(person),
      ])
    })

    const stageKey =
      detailStageFilter === 'picking'
        ? 'picking'
        : detailStageFilter === 'sorting'
          ? 'sorting'
          : detailStageFilter === 'packing'
            ? 'packing'
            : 'all'
    const filename = `人员明细_${selectedDate}_${stageKey}.xlsx`

    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '人员明细')
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(t('导出') + '失败')
    }
  }

  const handleUploadClick = (key) => {
    if (!selectedDate) return
    fileInputs.current[key]?.click()
  }

  const handleDelete = async (key) => {
    if (!selectedDate) return
    if (!confirm('确定删除该日期已上传的数据吗？')) return
    try {
      const response = await fetch(`/api/uploads?date=${selectedDate}&type=${key}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const message = await response.text()
        alert(`删除失败：${message}`)
        return
      }
      await fetchUploadState(selectedDate)
      if (key === 'sorting') setSortingReport(null)
      if (key === 'picking') setPickingReport(null)
      if (key === 'packing') setPackingReport(null)
      if (key === 'attendance') setAttendanceReport(null)
    } catch (error) {
      alert(t('删除失败，请检查后端服务是否启动。'))
    }
  }

  const handleFileChange = async (key, event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedDate) return
    const formData = new FormData()
    formData.append('date', selectedDate)
    formData.append('type', key)
    formData.append('file', file)
    setUploadingKeys((prev) => new Set(prev).add(key))
    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const message = await response.text()
        alert(`${t('上传失败')}: ${message}`)
        return
      }
      const payload = await response.json()
      await fetchUploadState(selectedDate)
      if (key === 'sorting' && payload?.validationStatus !== 'reject') {
        await fetchSortingReport(selectedDate)
        setDetailStageFilter('sorting')
        setStageFilter('sorting')
      } else if (key === 'sorting') {
        setSortingReport(null)
      }
      if (key === 'picking' && payload?.validationStatus !== 'reject') {
        await fetchPickingReport(selectedDate)
        setDetailStageFilter('picking')
        setStageFilter('picking')
      } else if (key === 'picking') {
        setPickingReport(null)
      }
      if (key === 'packing' && payload?.validationStatus !== 'reject') {
        await fetchPackingReport(selectedDate)
        setDetailStageFilter('packing')
        setStageFilter('packing')
      } else if (key === 'packing') {
        setPackingReport(null)
      }
    } catch (error) {
      alert(t('上传失败，请检查后端服务是否启动。'))
    } finally {
      event.target.value = ''
      setUploadingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }
  return (
    <div className="app">
      <div className="topnav">
        <div className="topnav__brand">{t('出库人效看板')}</div>
        <nav className="topnav__links">
          {quickLinks.slice(0, 4).map((item, index) => (
            <a
              key={`${item.label}-${index}`}
              className={`topnav__link ${item.url ? '' : 'disabled'}`}
              href={item.url || '#'}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!item.url) event.preventDefault()
              }}
            >
              {item.label || `入口${index + 1}`}
            </a>
          ))}
        </nav>
        <div className="topnav__date" ref={dateBtnRef}>
          <button
            type="button"
            className={
              showDateDropdown
                ? `topnav__datebtn date-${getDateTone(selectedDate)}`
                : 'topnav__datebtn topnav__link'
            }
            onClick={() => setShowDateDropdown((s) => !s)}
            aria-haspopup="dialog"
            aria-expanded={showDateDropdown}
          >
            <Icon name="calendar" /> <span style={{ marginLeft: 8 }}>{selectedDateLabel || t('请选择日期')}</span>
          </button>
          {showDateDropdown ? (
            <div className="topnav__datedrop" role="dialog" aria-label="日期选择">
              <div className="topnav__datedrop-list">
                {dateList.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`${item.key === selectedDate ? 'date-item active' : 'date-item'} ${'date-' + getDateTone(item.key)}`}
                    onClick={() => {
                      setSelectedDate(item.key)
                      setShowDateDropdown(false)
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div style={{ paddingTop: 8, borderTop: '1px solid rgba(18,19,21,0.04)' }}>
                <input
                  type="date"
                  value={selectedDate}
                  max={toDateKey(new Date())}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setShowDateDropdown(false)
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="topnav__leaders"
          onClick={() => setShowWhitelist(true)}
        >
          <Icon name="user" /> <span style={{ marginLeft: 8 }}>{t('白名单')}</span>
        </button>
        <button
          type="button"
          className="topnav__detail"
          onClick={() => {
            setSelectedMatchName('')
            setShowAccountLink(true)
          }}
        >
          <Icon name="link" /> <span style={{ marginLeft: 8 }}>{t('账号关联')}</span>
        </button>
        <button
          type="button"
          className="topnav__detail"
          onClick={() => {
            document.getElementById('detailSection')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <Icon name="user" /> <span style={{ marginLeft: 8 }}>{t('人员明细')}</span>
        </button>
        <button type="button" className="topnav__settings" onClick={() => setShowSettings(true)}>
          <Icon name="settings" /> <span style={{ marginLeft: 8 }}>{t('设置')}</span>
        </button>
      </div>

      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Outbound Productivity</p>
          <h1>{t('出库人效看板')}</h1>
          <p className="subtitle">{t('选中日期')}: {selectedDateLabel}</p>
          <div className="hero__meta">
            <div className="meta-card">
              <span>{t('今日有效工时')}</span>
              <strong>{reportForDetails ? formatHours(reportForDetails.kpi.totalEwhHoursAll) : '--'}</strong>
            </div>
            <div className="meta-card">
              <span>{t('今日产出量')}</span>
              <strong
                key={productionStages[productionIndex]?.key}
                className="meta-card__value"
              >
                {productionStages[productionIndex]?.value ?? '--'}
              </strong>
              <small>
                {productionStages[productionIndex]?.label
                  ? t(productionStages[productionIndex]?.label)
                  : t('包含拣货 / 打包 / 分拨')}
              </small>
            </div>
            <div className="meta-card">
              <span>{t('出勤工时')}</span>
              <strong>{attendanceReport ? formatHours(attendanceReport.kpi.totalEwhHoursAll) : '--'}</strong>
              <small>{attendanceReport ? t('考勤表统计') : t('等待考勤数据')}</small>
            </div>
          </div>
          <div className="kpi-row kpi-row--compact">
            <div className="kpi-card kpi-mini picking">
              <h3>{t('拣货人效')}</h3>
              <strong>{pickingMini === null ? '--' : pickingMini.toFixed(1)}</strong>
              <small>{t('单 / 小时')}</small>
            </div>
            <div className="kpi-card kpi-mini sorting">
              <h3>{t('分拨人效')}</h3>
              <strong>{sortingMini === null ? '--' : sortingMini.toFixed(1)}</strong>
              <small>{t('单 / 小时')}</small>
            </div>
            <div className="kpi-card kpi-mini packing-single">
              <h3>{t('单品打包')}</h3>
              <strong>{packingSingleMini === null ? '--' : packingSingleMini.toFixed(1)}</strong>
              <small>{t('单 / 小时')}</small>
            </div>
            <div className="kpi-card kpi-mini packing-multi">
              <h3>{t('多品打包')}</h3>
              <strong>{packingMultiMini === null ? '--' : packingMultiMini.toFixed(1)}</strong>
              <small>{t('单 / 小时')}</small>
            </div>
          </div>
          <div className="hero__filters">
            <div className="eff-toolbar">
              <button
                type="button"
                className={efficiencyFilter === 'picking' ? 'eff-chip active' : 'eff-chip'}
                onClick={() => setEfficiencyFilter('picking')}
              >
                {t('拣货')}
              </button>
              <button
                type="button"
                className={efficiencyFilter === 'sorting' ? 'eff-chip active' : 'eff-chip'}
                onClick={() => setEfficiencyFilter('sorting')}
              >
                {t('分拨')}
              </button>
              <button
                type="button"
                className={efficiencyFilter === 'packing-single' ? 'eff-chip active' : 'eff-chip'}
                onClick={() => setEfficiencyFilter('packing-single')}
              >
                {t('单品打包')}
              </button>
              <button
                type="button"
                className={efficiencyFilter === 'packing-multi' ? 'eff-chip active' : 'eff-chip'}
                onClick={() => setEfficiencyFilter('packing-multi')}
              >
                {t('多品打包')}
              </button>
              <div className="eff-controls">
                <input
                  className="eff-input"
                  type="number"
                  min="0"
                  placeholder={t('件数下限')}
                  value={efficiencyMinUnits}
                  onChange={(event) => setEfficiencyMinUnits(event.target.value)}
                />
                <select
                  className="eff-select"
                  value={efficiencySortKey}
                  onChange={(event) => setEfficiencySortKey(event.target.value)}
                >
                  <option value="units">{t('件数')}</option>
                  <option value="hours">{t('耗时')}</option>
                  <option value="eff">{t('时效')}</option>
                  <option value="dayEff">{t('全天时效')}</option>
                </select>
              </div>
            </div>
            <div className="eff-table">
              <div className="eff-row eff-head">
                <span>{t('人员')}</span>
                <span>{t('件数')}</span>
                <span>{t('耗时')}</span>
                <span>{t('时效')}</span>
                <span>{t('全天时效')}</span>
              </div>
              {efficiencyRows.length ? (
                efficiencyRows.map((row) => (
                  <div key={row.name} className="eff-row">
                    <span>{row.name}</span>
                    <span>{row.units || row.units === 0 ? row.units : '--'}</span>
                    <span>{row.hours ? formatHours(row.hours) : '--'}</span>
                    <span>{row.eff ? row.eff.toFixed(1) : '--'}</span>
                    <span>{row.dayEff ? row.dayEff.toFixed(1) : '--'}</span>
                  </div>
                ))
              ) : (
                <div className="eff-empty">{t('暂无人效数据')}</div>
              )}
            </div>
          </div>
        </div>
        <div className="hero__panel">
          <div className="upload-panel">
            <div className="panel-header">
              <h3>{t('每日上传')}</h3>
              <span>{t('已选日期')}: {selectedDate} ({selectedDateLabel})</span>
            </div>
            <div className="upload-grid">
              {uploads.filter((item) => !item.auto).map((item) => {
                const view = getUploadView(item.key, uploadState)
                const isUploading = uploadingKeys.has(item.key)
                const helper =
                  view.tone === 'error' && view.dateKey
                    ? `${t('最近上传日期')}: ${view.dateKey}`
                    : `${t('归属日期')}: ${selectedDate}`
                const descText = view.filename || t(item.desc)
                const validationText =
                  view.validation === 'pass'
                    ? t('校验通过')
                    : view.validation === 'warn'
                      ? t('校验警告')
                      : view.validation === 'reject'
                        ? t('校验未通过')
                        : ''
                const issueList = [...view.errors, ...view.warnings].filter(Boolean)
                const issueText = issueList.length ? `｜${issueList[0]}` : ''
                const metaText = validationText ? `${helper} ｜ ${validationText}${issueText}` : helper
                return (
                  <div key={item.title} className={`upload-card ${view.tone}`}>
                    <div>
                      <h4>{t(item.title)}</h4>
                      <p>{descText}</p>
                    </div>
                  <div className="upload-footer">
                    <span className={`status ${view.tone}`}>
                      {isUploading ? (
                        <span className="uploading-text">
                          {t('上传中')} <span className="uploading-dots" aria-hidden="true" />
                        </span>
                      ) : (
                        t(view.label)
                      )}
                    </span>
                    <div className="upload-actions">
                      <button
                        type="button"
                        onClick={() => handleUploadClick(item.key)}
                        disabled={!selectedDate || isUploading}
                      >
                        <Icon name="upload" /> <span style={{ marginLeft: 6 }}>{t('上传')}</span>
                      </button>
                      {view.tone !== 'waiting' && (
                        <button type="button" className="danger" onClick={() => handleDelete(item.key)}>
                          <Icon name="trash" /> <span style={{ marginLeft: 6 }}>{t('删除')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                    <small>{metaText} ｜ {t('更新时间')}: {view.updated}</small>
                    <input
                      ref={(node) => {
                        fileInputs.current[item.key] = node
                      }}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={(event) => handleFileChange(item.key, event)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="upload-banner">
            <img
              src="https://static.foodtalks.cn/image/post/2f2fef56d86351a93519804c54ca5c2c.png"
              alt="banner"
              className="upload-banner-img"
            />
            <div className="upload-banner-overlay" aria-hidden="true">
              <div className="banner-left">战斗战斗</div>
              <div className="banner-right">结果第一</div>
            </div>
          </div>
        </div>
      </header>

      <section className="timeline-section">
        <div className="timeline-header">
          <div>
            <h2>{t('人员工时可视化')}</h2>
          </div>
          <div className="legend">
            <input
              className="timeline-search"
              type="text"
              value={timelineSearch}
              onChange={(event) => setTimelineSearch(event.target.value)}
              placeholder={t('搜索人员')}
            />
            <button
              type="button"
              className={`legend-item ${stageFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setStageFilter('all')
                setDetailStageFilter('all')
              }}
            >
              {t('全部')}
            </button>
            <button
              type="button"
              className={`legend-item picking ${stageFilter === 'picking' ? 'active' : ''}`}
              onClick={() => {
                setStageFilter('picking')
                setDetailStageFilter('picking')
              }}
            >
              {t('拣货')}
            </button>
            <button
              type="button"
              className={`legend-item sorting ${stageFilter === 'sorting' ? 'active' : ''}`}
              onClick={() => {
                setStageFilter('sorting')
                setDetailStageFilter('sorting')
              }}
            >
              {t('分拨')}
            </button>
            <button
              type="button"
              className={`legend-item packing ${stageFilter === 'packing' ? 'active' : ''}`}
              onClick={() => {
                setStageFilter('packing')
                setDetailStageFilter('packing')
              }}
            >
              {t('打包')}
            </button>
          </div>
        </div>
        <div className="timeline" onMouseLeave={hideTimelineTip}>
          <div className="timeline-axis">
            <div className="timeline-axis__label">{t('员工')}</div>
            <div className="timeline-axis__grid">
              {timelineHours.map((item) => (
                <span
                  key={`${item.hour}-${item.offset}`}
                  style={{ left: `${((item.offset - dayStart) / daySpan) * 100}%` }}
                >
                  {`${item.hour.toString().padStart(2, '0')}:00`}
                </span>
              ))}
            </div>
          </div>
          {groupedTimeline.length ? (
            groupedTimeline.map((group) => (
              <div key={group.key} className="timeline-group">
                <div className="timeline-group__title">
                  <span>{group.label}</span>
                </div>
                {group.rows.map((row) => (
                  <div key={row.name} className="timeline-row">
                    <div className="timeline-employee">
                      <strong>{row.name}</strong>
                    </div>
                    <div className="timeline-track" onMouseLeave={hideTimelineTip}>
                      {row.segments.map((seg, index) => {
                        const left = ((seg.start - dayStart) / daySpan) * 100
                        const width = ((seg.end - seg.start) / daySpan) * 100
                        return (
                          <span
                            key={`${row.name}-${index}`}
                            className={`segment ${seg.type}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            onMouseMove={(event) => showTimelineTip(event, seg, row)}
                            onMouseLeave={hideTimelineTip}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="timeline-empty">{t('暂无数据，请先上传并校验通过')}</div>
          )}
        </div>
        {timelineTip.visible && (
          <div className="timeline-tooltip" style={{ left: timelineTip.x, top: timelineTip.y }}>
            {timelineTip.content}
          </div>
        )}
      </section>

      <section className="kpi-row">
        <div className="kpi-card">
          <h3>{t('有效工时占比')}</h3>
          {detailStageFilter === 'all' ? (
            <>
              <strong>{sortingKpi ? `${Math.round(sortingKpi.ratio * 100)}%` : '--'}</strong>
              <small>分拨</small>
              <strong>{pickingKpi ? `${Math.round(pickingKpi.ratio * 100)}%` : '--'}</strong>
              <small>拣货</small>
            </>
          ) : (
            <>
              <strong>{activeKpi ? `${Math.round(activeKpi.ratio * 100)}%` : '--'}</strong>
              <small>{t('有效工时 / 基准工时(8h)')}</small>
            </>
          )}
        </div>
        <div className="kpi-card">
          <h3>{t('人效均值')}</h3>
          {detailStageFilter === 'all' ? (
            <>
              <strong>{sortingKpi ? sortingKpi.avgUph.toFixed(1) : '--'}</strong>
              <small>{t('分拨 单 / 小时')}</small>
              <strong>{pickingKpi ? pickingKpi.avgUph.toFixed(1) : '--'}</strong>
              <small>{t('拣货 单 / 小时')}</small>
            </>
          ) : (
            <>
              <strong>{activeKpi ? activeKpi.avgUph.toFixed(1) : '--'}</strong>
              <small>{activeKpi ? `${t(stageLabel)} ${t('单 / 小时')}` : t('单 / 小时')}</small>
            </>
          )}
        </div>
        <div className="kpi-card">
          <h3>{t('异常提示')}</h3>
          <>
            <strong>{detailAbnormal.total}</strong>
            <small>{t('异常人员')}</small>
            <strong>{detailAbnormal.lowRatio}</strong>
            <small>{t('占比低于 75%')}</small>
            <strong>{detailAbnormal.unmatched}</strong>
            <small>{t('账号未匹配')}</small>
          </>
        </div>
      </section>

      <section className="table-section" id="detailSection">
        <div className="table-header">
          <h2>{t('人员明细')}</h2>
          <div className="table-actions">
            <div className="detail-filters">
              <input
                className="detail-search"
                type="text"
                value={detailSearch}
                onChange={(event) => setDetailSearch(event.target.value)}
                placeholder={t('搜索人员')}
              />
              {isFiltering ? <span className="filter-spinner" aria-hidden /> : null}
              <button
                type="button"
                className={detailStageFilter === 'all' ? 'chip active' : 'chip'}
                onClick={() => setDetailStageFilter('all')}
              >
                {t('全部')}
              </button>
              <button
                type="button"
                className={detailStageFilter === 'picking' ? 'chip active' : 'chip'}
                onClick={() => setDetailStageFilter('picking')}
              >
                {t('拣货')}
              </button>
              <button
                type="button"
                className={detailStageFilter === 'packing' ? 'chip active' : 'chip'}
                onClick={() => setDetailStageFilter('packing')}
              >
                {t('打包')}
              </button>
              <button
                type="button"
                className={detailStageFilter === 'sorting' ? 'chip active' : 'chip'}
                onClick={() => setDetailStageFilter('sorting')}
              >
                {t('分拨')}
              </button>
              <button
                type="button"
                className={detailOnlyAbnormal ? 'chip chip-check active' : 'chip chip-check'}
                onClick={() => setDetailOnlyAbnormal((prev) => !prev)}
              >
                {t('异常')}
              </button>
              <select
                className="team-select"
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                disabled={detailTeams.length === 0}
              >
                <option value="all">{t('全部班组')}</option>
                {detailTeams.map((team) => (
                  <option key={team} value={team}>
                    {t(team)}
                  </option>
                ))}
              </select>
              <select
                className="team-select sort-select"
                value={detailSortKey}
                onChange={(event) => {
                  const next = event.target.value
                  setDetailSortKey(next)
                  if (next === 'name' || next === 'start') {
                    setDetailSortDir('asc')
                  } else {
                    setDetailSortDir('desc')
                  }
                }}
              >
                <option value="name">{t('名字')}</option>
                <option value="start">{t('开始工作')}</option>
                <option value="ewh">{t('有效工时')}</option>
                <option value="hours">{t('工时')}</option>
                <option value="ot">{t('加班')}</option>
                <option value="units">{t('件数')}</option>
                <option value="score">{t('综合分')}</option>
                <option value="eff">{t('时效')}</option>
                <option value="ratio">{t('工作时间占比')}</option>
              </select>
              <button
                type="button"
                className="chip chip-check"
                onClick={() => setDetailSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                title={t('排序')}
              >
                {detailSortDir === 'asc' ? t('升序') : t('降序')}
              </button>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setSelectedMatchName('')
                setShowMatch(true)
              }}
            >
              <Icon name="link" /> <span style={{ marginLeft: 8 }}>{t('手动匹配')}</span>
            </button>
            <button
              type="button"
              className="ghost"
              onClick={exportDetailExcel}
              disabled={!sortedDetailRows.length}
            >
              <Icon name="file" /> <span style={{ marginLeft: 8 }}>{t('导出')}</span>
            </button>
            <button type="button" className="primary"><Icon name="calendar" /> <span style={{ marginLeft: 8 }}>{t('生成日报')}</span></button>
          </div>
        </div>
          <div className="table">
            <div className="table-row table-head">
              <span>{t('名字')}</span>
              <span>{t('开始工作')}</span>
              <span>{t('有效工时')}</span>
              <span>{t('工时')}</span>
              <span>{t('加班')}</span>
              <span>{t('件数')}</span>
              <span>{t('综合分')}</span>
              <span>{t('时效')}</span>
              <span>{t('工作时间占比')}</span>
            </div>
          {detailRows.length ? (
            sortedDetailRows.map((person) => {
                const ratio =
                  person.attendanceHours > 0 ? (person.ewhHours / person.attendanceHours) * 100 : null
                const groupList = Array.from(person.groups)
                const groupText = groupList.join(' / ') || '--'
                const detailText = `拣货 ${person.pickingUnits} | 分拨 ${person.sortingUnits} | 打包 ${
                  person.packingSingleUnits + person.packingMultiUnits
                }`
                const unitParts = []
                if (detailStageFilter === 'picking') {
                  unitParts.push(`拣货:${person.pickingUnits}`)
                } else if (detailStageFilter === 'sorting') {
                  unitParts.push(`分拨:${person.sortingUnits}`)
                } else if (detailStageFilter === 'packing') {
                  if (person.packingSingleUnits) unitParts.push(`单品:${person.packingSingleUnits}`)
                  if (person.packingMultiUnits) unitParts.push(`多品:${person.packingMultiUnits}`)
                } else {
                  if (person.pickingUnits) unitParts.push(`拣货:${person.pickingUnits}`)
                  if (person.sortingUnits) unitParts.push(`分拨:${person.sortingUnits}`)
                  if (person.packingSingleUnits) unitParts.push(`单品:${person.packingSingleUnits}`)
                  if (person.packingMultiUnits) unitParts.push(`多品:${person.packingMultiUnits}`)
                }
                const unitsLabel = unitParts.length ? unitParts.join('  ') : '--'
                const units =
                  detailStageFilter === 'picking'
                    ? person.pickingUnits
                    : detailStageFilter === 'sorting'
                      ? person.sortingUnits
                      : detailStageFilter === 'packing'
                        ? person.packingSingleUnits + person.packingMultiUnits
                      : person.pickingUnits + person.sortingUnits
                const ewh =
                  detailStageFilter === 'picking'
                    ? person.pickingEwhHours
                    : detailStageFilter === 'sorting'
                      ? person.sortingEwhHours
                      : detailStageFilter === 'packing'
                        ? person.packingSingleEwhHours + person.packingMultiEwhHours
                      : person.ewhHours
                const eff = ewh > 0 ? units / ewh : null
                const effParts = []
                if (detailStageFilter === 'picking') {
                  effParts.push(`拣货:${eff === null ? '--' : eff.toFixed(1)}`)
                } else if (detailStageFilter === 'sorting') {
                  effParts.push(`分拨:${eff === null ? '--' : eff.toFixed(1)}`)
                } else if (detailStageFilter === 'packing') {
                  const singleEff =
                    person.packingSingleEwhHours > 0
                      ? person.packingSingleUnits / person.packingSingleEwhHours
                      : null
                  const multiEff =
                    person.packingMultiEwhHours > 0
                      ? person.packingMultiUnits / person.packingMultiEwhHours
                      : null
                  if (person.packingSingleUnits) effParts.push(`单品:${singleEff === null ? '--' : singleEff.toFixed(1)}`)
                  if (person.packingMultiUnits) effParts.push(`多品:${multiEff === null ? '--' : multiEff.toFixed(1)}`)
                } else {
                  const pickEff =
                    person.pickingEwhHours > 0 ? person.pickingUnits / person.pickingEwhHours : null
                  const sortEff =
                    person.sortingEwhHours > 0 ? person.sortingUnits / person.sortingEwhHours : null
                  const singleEff =
                    person.packingSingleEwhHours > 0
                      ? person.packingSingleUnits / person.packingSingleEwhHours
                      : null
                  const multiEff =
                    person.packingMultiEwhHours > 0
                      ? person.packingMultiUnits / person.packingMultiEwhHours
                      : null
                if (person.pickingUnits || person.pickingEwhHours) {
                    effParts.push(`${t('拣货')}:${pickEff === null ? '--' : pickEff.toFixed(1)}`)
                  }
                  if (person.sortingUnits || person.sortingEwhHours) {
                    effParts.push(`${t('分拨')}:${sortEff === null ? '--' : sortEff.toFixed(1)}`)
                  }
                  if (person.packingSingleUnits || person.packingSingleEwhHours) {
                    effParts.push(`${t('单品')}:${singleEff === null ? '--' : singleEff.toFixed(1)}`)
                  }
                  if (person.packingMultiUnits || person.packingMultiEwhHours) {
                    effParts.push(`${t('多品')}:${multiEff === null ? '--' : multiEff.toFixed(1)}`)
                  }
                }
                const effLabel = effParts.length ? effParts.join('  ') : '--'
                const whitelistRole = getWhitelistRole(person)
                const whitelistExempt = isWhitelistExempt(whitelistRole)
                const forcedIssue = whitelistRole === '异常'
                const matchIssue =
                  !whitelistExempt &&
                  hasAttendanceData &&
                  (!person.attendanceMatched || person.attendanceHours <= 0)
                const ratioIssue =
                  !whitelistExempt && ratio !== null && (ratio < 75 || ratio > 100)
                const waitingAttendance =
                  !hasAttendanceData && person.ewhHours > 0
                const matchedByManual =
                  person.attendanceName && effectiveNameMap[person.attendanceName]
                const hasIssue = forcedIssue || matchIssue || ratioIssue
                const canOpenMatch =
                  person.attendanceName &&
                  (hasIssue ||
                    effectiveNameMap[person.attendanceName] ||
                    whitelistRole)
                const statusLabel = whitelistRole
                  ? t(whitelistRole)
                  : waitingAttendance
                    ? t('待上传')
                    : hasIssue
                      ? t('异常')
                      : matchedByManual
                        ? t('已匹配')
                        : t('正常')
                const statusTone = whitelistRole
                  ? whitelistRole === '异常'
                    ? 'error'
                    : 'leader'
                  : waitingAttendance
                    ? 'pending'
                    : hasIssue
                      ? 'error'
                      : matchedByManual
                        ? 'matched'
                        : 'success'
                // 行级背景状态：红 = 时效异常（ratioIssue），黄 = 未匹配（matchIssue），白 = 正常/白名单
                let rowState = 'row-normal'
                // 优先显示“未匹配”为黄色，其次显示时效异常为红色
                if (matchIssue) rowState = 'row-warning'
                else if (ratioIssue) rowState = 'row-error'
                const sourceName =
                  person.sources && person.sources.size ? Array.from(person.sources)[0] : person.name
                const startMap =
                  detailStageFilter === 'picking'
                    ? startTimeMaps.picking
                    : detailStageFilter === 'sorting'
                      ? startTimeMaps.sorting
                      : detailStageFilter === 'packing'
                        ? startTimeMaps.packing
                        : startTimeMaps.all
                const startKey = person.attendanceName
                  ? normalizeName(person.attendanceName)
                  : person.workKey
                    ? person.workKey
                    : person.sources && person.sources.size
                      ? normalizeWorkKey(Array.from(person.sources)[0])
                      : normalizeName(person.name)
                const startMs = startMap.get(startKey)
                const startLabel = Number.isFinite(startMs)
                  ? new Date(startMs).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                  : '--'
                const shiftLabel = person.shiftType || ''
                const shiftTone =
                  shiftLabel.includes('早') || shiftLabel.includes('白')
                    ? 'shift-day'
                    : shiftLabel.includes('晚') || shiftLabel.includes('夜')
                      ? 'shift-night'
                      : ''

                return (
                  <div key={person.name} className={`table-row ${rowState}`}>
                    <div className="person" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{person.name}</strong>
                      <span
                        className={`status-tag ${statusTone}`}
                        role={canOpenMatch ? 'button' : undefined}
                        onClick={() => {
                          if (!canOpenMatch) return
                          setSelectedMatchName(person.attendanceName || person.name)
                          setShowMatch(true)
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <span className="badge-group">
                      {shiftTone ? (
                        <span className={`unit-tag ${shiftTone}`}>{startLabel}</span>
                      ) : (
                        startLabel
                      )}
                    </span>
                    <span>{formatHours(person.ewhHours)}</span>
                    <span>{person.attendanceHours ? formatHours(person.attendanceHours) : '--'}</span>
                    <span>
                      {person.attendanceHours
                        ? person.attendanceHours > 8
                          ? `${(person.attendanceHours - 8).toFixed(1)}h`
                          : '—'
                        : '--'}
                    </span>
                    <span className="badge-group">
                      {unitsLabel === '--' ? (
                        '--'
                      ) : (
                        <RotatingBadges
                          items={unitParts}
                          getTone={(part) =>
                            part.startsWith('拣货')
                              ? 'picking'
                              : part.startsWith('分拨')
                                ? 'sorting'
                                : part.startsWith('单品')
                                  ? 'packing-single'
                                  : part.startsWith('多品')
                                    ? 'packing-multi'
                                    : 'packing'
                          }
                          prefix={`units-${person.name}`}
                        />
                      )}
                    </span>
                    <span>
                      {typeof person.compositeScore === 'number' ? person.compositeScore.toFixed(2) : '--'}
                    </span>
                    <span className="badge-group">
                      {effLabel === '--' ? (
                        '--'
                      ) : (
                        <RotatingBadges
                          items={effParts}
                          getTone={(part) =>
                            part.startsWith('拣货')
                              ? 'picking'
                              : part.startsWith('分拨')
                                ? 'sorting'
                                : part.startsWith('单品')
                                  ? 'packing-single'
                                  : part.startsWith('多品')
                                    ? 'packing-multi'
                                    : 'packing'
                          }
                          prefix={`eff-${person.name}`}
                        />
                      )}
                    </span>
                    <span>{ratio === null ? '--' : `${ratio.toFixed(0)}%`}</span>
                    {/* status moved next to name */}
                  </div>
                )
              })
          ) : (
            <div className="table-row">
              <span>{t('暂无数据')}</span>
              <span>--</span>
              <span>--</span>
              <span>--</span>
              <span>--</span>
              <span>--</span>
              <span>--</span>
              <span>--</span>
              <span>--</span>
            </div>
          )}
        </div>
      </section>

      {showSettings && (
        <div className="settings-backdrop" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <h3>{t('数据入口设置')}</h3>
              <button type="button" onClick={() => setShowSettings(false)}>
                {t('关闭')}
              </button>
            </div>
            <div className="settings-grid">
              {quickLinks.map((item, index) => (
                <div key={`${item.label}-${index}`} className="settings-item">
                  <input
                    className="settings-input"
                    type="text"
                    value={item.label}
                    onChange={(event) => updateQuickLink(index, 'label', event.target.value)}
                    placeholder={t('入口名称')}
                  />
                  <input
                    className="settings-input"
                    type="text"
                    value={item.url}
                    onChange={(event) => updateQuickLink(index, 'url', event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
            <div className="settings-footer">
              <div className="settings-lang">
                <span>{t('语言')}</span>
                <div className="settings-lang-actions">
                  <button
                    type="button"
                    className={lang === 'zh' ? 'active' : ''}
                    onClick={() => setLang('zh')}
                  >
                    {t('中文')}
                  </button>
                  <button
                    type="button"
                    className={lang === 'en' ? 'active' : ''}
                    onClick={() => setLang('en')}
                  >
                    {t('英语')}
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => setShowSettings(false)}>
                {t('完成')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccountLink && (
        <div className="settings-backdrop" onClick={() => setShowAccountLink(false)}>
          <div className="settings-panel match-panel" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <h3>账号关联（全局）</h3>
              <button type="button" onClick={() => setShowAccountLink(false)}>
                {t('关闭')}
              </button>
            </div>
            <div className="match-list">
              {selectedMatchName && !accountLinkPanelNames.includes(selectedMatchName) ? (
                <div className="match-empty">{t('请选择考勤账号进行匹配')}</div>
              ) : null}
              {attendanceNames.length === 0 ? (
                <div className="match-empty">{t('暂无考勤数据，无法匹配。')}</div>
              ) : accountLinkPanelNames.length === 0 ? (
                <div className="match-empty">{t('当前没有需要匹配的姓名。')}</div>
              ) : (
                (selectedMatchName && accountLinkPanelNames.includes(selectedMatchName)
                  ? [selectedMatchName]
                  : accountLinkPanelNames
                ).map((name) => {
                  const current = accountLinkMap[name] || ''
                  return (
                    <div key={`al-${name}`} className="match-item">
                      <div className="match-name">{name}</div>
                      <div className="match-select-wrap">
                        <input
                          className="match-select"
                          list={`account-link-opts-${name}`}
                          value={current}
                          onChange={(event) => updateAccountLinkMap(name, event.target.value)}
                          placeholder={t('选择工作账号')}
                        />
                        <datalist id={`account-link-opts-${name}`}>
                          {availableWorkOptions
                            .concat(current && !availableWorkOptions.includes(current) ? [current] : [])
                            .map((att) => (
                              <option key={`${name}-${att}`} value={att} />
                            ))}
                        </datalist>
                      </div>
                      <button
                        type="button"
                        className="match-clear"
                        onClick={() => updateAccountLinkMap(name, '')}
                      >
                        {t('取消匹配')}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
            <div className="settings-footer">
              <span>{t('匹配全局生效')}</span>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(t('确认清空所有手动匹配？'))) return
                  resetAccountLinks()
                }}
              >
                {t('清空匹配')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMatch && (
        <div className="settings-backdrop" onClick={() => setShowMatch(false)}>
          <div className="settings-panel match-panel" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <h3>{t('人员匹配（以考勤姓名为主）')}</h3>
              <button type="button" onClick={() => setShowMatch(false)}>
                {t('关闭')}
              </button>
            </div>
            <div className="match-list">
              {selectedMatchName && !matchPanelNames.includes(selectedMatchName) ? (
                <div className="match-empty">{t('请选择考勤账号进行匹配')}</div>
              ) : null}
              {attendanceNames.length === 0 ? (
                <div className="match-empty">{t('暂无考勤数据，无法匹配。')}</div>
              ) : selectedMatchName ? (
                (selectedMatchName ? [selectedMatchName] : [])
                  .map((name) => {
                    const current = manualNameMap[name] || ''
                    const isAutoMatched = autoMatchedNameSet.has(name)
                    return (
                      <div key={name} className="match-item">
                        <div className="match-name">{name}</div>
                        <div className="match-select-wrap">
                          <input
                            className="match-select"
                            list={`match-opts-${name}`}
                            value={current}
                            onChange={(event) => updateNameMap(name, event.target.value)}
                            placeholder={t('选择工作账号')}
                            disabled={!attendanceNames.includes(name) || (isAutoMatched && !current)}
                          />
                          <datalist id={`match-opts-${name}`}>
                            {availableWorkOptions
                              .concat(current && !availableWorkOptions.includes(current) ? [current] : [])
                              .map((att) => (
                                <option key={att} value={att} />
                              ))}
                          </datalist>
                          {isAutoMatched && !current && (
                            <div className="match-hint">{t('系统自动匹配不可修改')}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="match-clear"
                          onClick={() => updateNameMap(name, '')}
                          disabled={!attendanceNames.includes(name) || (isAutoMatched && !current)}
                        >
                          {t('取消匹配')}
                        </button>
                      </div>
                    )
                  })
              ) : matchPanelNames.length === 0 ? (
                <div className="match-empty">{t('当前没有需要匹配的姓名。')}</div>
              ) : (
                matchPanelNames
                  .sort((a, b) =>
                    selectedMatchName && a === selectedMatchName
                      ? -1
                      : selectedMatchName && b === selectedMatchName
                        ? 1
                        : 0
                  )
                  .map((name) => {
                    const current = manualNameMap[name] || ''
                    const isAutoMatched = autoMatchedNameSet.has(name)
                    return (
                      <div key={name} className="match-item">
                        <div className="match-name">{name}</div>
                        <div className="match-select-wrap">
                          <input
                            className="match-select"
                            list={`match-opts-${name}`}
                            value={current}
                            onChange={(event) => updateNameMap(name, event.target.value)}
                            placeholder={t('选择工作账号')}
                            disabled={isAutoMatched && !current}
                          />
                          <datalist id={`match-opts-${name}`}>
                            {availableWorkOptions
                              .concat(current && !availableWorkOptions.includes(current) ? [current] : [])
                              .map((att) => (
                                <option key={att} value={att} />
                              ))}
                          </datalist>
                          {isAutoMatched && !current && (
                            <div className="match-hint">{t('系统自动匹配不可修改')}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="match-clear"
                          onClick={() => updateNameMap(name, '')}
                          disabled={isAutoMatched && !current}
                        >
                          {t('取消匹配')}
                        </button>
                      </div>
                    )
                  })
              )}
            </div>
            <div className="settings-footer">
              <span>{t('匹配仅对当前日期生效')}</span>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(t('确认清空所有手动匹配？'))) return
                  resetManualMatches()
                }}
              >
                {t('清空匹配')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhitelist && (
        <div className="settings-backdrop" onClick={() => setShowWhitelist(false)}>
          <div className="settings-panel match-panel" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <h3>{t('白名单')}</h3>
              <button type="button" onClick={() => setShowWhitelist(false)}>
                {t('关闭')}
              </button>
            </div>
            {!whitelistUnlocked ? (
              <div className="leaders-lock">
                <div className="match-empty">{t('输入密码后可新增/删除白名单')}</div>
                <div className="leaders-lock-row">
                  <input
                    className="settings-input"
                    type="password"
                    placeholder={t('输入密码')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.currentTarget.value === '0402') {
                          setWhitelistUnlocked(true)
                        } else {
                          alert(t('密码错误'))
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="primary"
                    onClick={(event) => {
                      const input = event.currentTarget
                        .parentElement?.querySelector('input')
                      const value = input?.value || ''
                      if (value === '0402') {
                        setWhitelistUnlocked(true)
                      } else {
                        alert(t('密码错误'))
                      }
                    }}
                  >
                    {t('解锁')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="leaders-add">
                  <input
                    className="settings-input"
                    type="text"
                    placeholder={t('新增白名单姓名')}
                    value={whitelistInput}
                    onChange={(event) => setWhitelistInput(event.target.value)}
                  />
                  <select
                    className="settings-input"
                    value={whitelistRoleInput}
                    onChange={(event) => setWhitelistRoleInput(event.target.value)}
                  >
                    {whitelistRoles.map((role) => (
                      <option key={role} value={role}>
                        {t(role)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="primary"
                    onClick={async () => {
                      const name = whitelistInput.trim()
                      if (!name) return
                      try {
                        await fetch('/api/whitelist', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name, role: whitelistRoleInput }),
                        })
                        setWhitelistInput('')
                        await refreshWhitelist()
                      } catch (error) {
                        alert(t('添加失败'))
                      }
                    }}
                  >
                    {t('添加')}
                  </button>
                </div>
                <div className="match-list">
                  {whitelist.length ? (
                    whitelist.map((entry) => {
                      const entryName = entry?.name || entry
                      const entryRole = entry?.role || '组长'
                      return (
                        <div key={`${entryName}-${entryRole}`} className="match-item">
                          <div className="match-name">{entryName}</div>
                          <span className="unit-tag leader">{t(entryRole)}</span>
                          <button
                            type="button"
                            className="match-clear"
                            onClick={async () => {
                              if (!confirm(`删除 ${entryName}？`)) return
                              try {
                                const response = await fetch(
                                  `/api/whitelist?name=${encodeURIComponent(entryName)}`,
                                  { method: 'DELETE' }
                                )
                                if (!response.ok) {
                                  alert(t('删除失败'))
                                  return
                                }
                                await refreshWhitelist()
                              } catch (error) {
                                alert(t('删除失败'))
                              }
                            }}
                          >
                            {t('删除')}
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <div className="match-empty">{t('暂无白名单数据。')}</div>
                  )}
                </div>
              </>
            )}
            <div className="settings-footer">
              <span>{t('名单来自远程数据库，不随日期变化')}</span>
              <button type="button" onClick={() => setShowWhitelist(false)}>
                {t('确定')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const normalizeName = (name) => {
  const raw = String(name || '')
  const withoutParen = raw.replace(/\s*\([^)]*\)\s*$/g, '')
  const lowered = withoutParen.toLowerCase()
  const lettersOnly = lowered.replace(/[^a-z\u00c0-\u024f\u4e00-\u9fff]+/g, ' ')
  const noDigits = lettersOnly.replace(/\b\d+\b/g, ' ')
  return noDigits.replace(/\s+/g, ' ').trim()
}

const normalizeWorkKey = (name) => {
  const raw = String(name || '').trim()
  if (!raw) return ''
  const compact = raw.replace(/\s+/g, '')
  if (/^ob[a-z]*#?\d+/i.test(compact)) {
    return compact.toLowerCase()
  }
  return normalizeName(raw)
}

const buildDetailRows = (
  combinedReport,
  pickingReport,
  sortingReport,
  packingReport,
  attendanceReport,
  nameMap
) => {
  const rows = new Map()
  const attendanceNameByKey = new Map()
  const workData = new Map()
  const workSegmentsByKey = new Map()
  const linkedWork = new Set()
  const reverseNameMap = new Map()

  Object.entries(nameMap || {}).forEach(([att, work]) => {
    const key = normalizeWorkKey(work)
    if (key) reverseNameMap.set(key, att)
  })

  if (attendanceReport?.stats?.length) {
    attendanceReport.stats.forEach((stat) => {
      const key = normalizeName(stat.operator)
      if (key && !attendanceNameByKey.has(key)) {
        attendanceNameByKey.set(key, stat.operator)
      }
    })
  }

  const ensureWork = (operator) => {
    if (!workData.has(operator)) {
      workData.set(operator, {
        operator,
        ewhHours: 0,
        groups: new Set(),
        pickingUnits: 0,
        sortingUnits: 0,
        pickingEwhHours: 0,
        sortingEwhHours: 0,
        packingSingleUnits: 0,
        packingMultiUnits: 0,
        packingSingleEwhHours: 0,
        packingMultiEwhHours: 0,
      })
    }
    return workData.get(operator)
  }

  if (combinedReport?.stats?.length) {
    combinedReport.stats.forEach((stat) => {
      const work = ensureWork(stat.operator)
      work.ewhHours = Number(stat.ewhHours || 0)
    })
  }

  if (pickingReport?.stats?.length) {
    pickingReport.stats.forEach((stat) => {
      const work = ensureWork(stat.operator)
      work.groups.add('拣货')
      work.pickingUnits = Number(stat.totalUnits || 0)
      work.pickingEwhHours = Number(stat.ewhHours || 0)
    })
  }

  if (sortingReport?.stats?.length) {
    sortingReport.stats.forEach((stat) => {
      const work = ensureWork(stat.operator)
      work.groups.add('分拨')
      work.sortingUnits = Number(stat.totalUnits || 0)
      work.sortingEwhHours = Number(stat.ewhHours || 0)
    })
  }

  if (packingReport?.stats?.length) {
    packingReport.stats.forEach((stat) => {
      const work = ensureWork(stat.operator)
      work.groups.add('打包')
      work.packingSingleUnits = Number(stat.packingSingleUnits || 0)
      work.packingMultiUnits = Number(stat.packingMultiUnits || 0)
      work.packingSingleEwhHours = Number(stat.packingSingleEwhHours || 0)
      work.packingMultiEwhHours = Number(stat.packingMultiEwhHours || 0)
    })
  }

  if (combinedReport?.segments) {
    Object.entries(combinedReport.segments).forEach(([operator, segs]) => {
      const mapped = reverseNameMap.get(normalizeWorkKey(operator))
      const key = mapped ? normalizeName(mapped) : normalizeWorkKey(operator)
      if (!key) return
      const workSegs = (segs || []).filter(
        (seg) => seg.type === 'picking' || seg.type === 'sorting' || seg.type === 'packing'
      )
      if (workSegs.length) workSegmentsByKey.set(key, workSegs)
    })
  }

  const ensureRow = (key, baseName) => {
    if (!rows.has(key)) {
      rows.set(key, {
        name: baseName,
        attendanceName: '',
        groups: new Set(),
        ewhHours: 0,
        attendanceHours: 0,
        attendanceMatched: false,
        shiftType: '',
        pickingUnits: 0,
        sortingUnits: 0,
        pickingEwhHours: 0,
        sortingEwhHours: 0,
        packingSingleUnits: 0,
        packingMultiUnits: 0,
        packingSingleEwhHours: 0,
        packingMultiEwhHours: 0,
        // 综合分（前端按规则计算并缓存，非持久化）
        compositeScore: 0,
        // 预计算参与标记，避免运行时重复计算
        hasPicked: false,
        hasSorted: false,
        hasPacked: false,
        sources: new Set(),
        workKey: '',
      })
    }
    return rows.get(key)
  }

  const attachWork = (row, operator) => {
    const work = workData.get(operator)
    if (!work) return
    row.sources.add(operator)
    if (!row.workKey) row.workKey = normalizeWorkKey(operator)
    if (row.attendanceHours > 0) row.attendanceMatched = true
    work.groups.forEach((group) => row.groups.add(group))
    row.pickingUnits += work.pickingUnits
    row.pickingEwhHours += work.pickingEwhHours
    row.sortingUnits += work.sortingUnits
    row.sortingEwhHours += work.sortingEwhHours
    row.packingSingleUnits += work.packingSingleUnits
    row.packingMultiUnits += work.packingMultiUnits
    row.packingSingleEwhHours += work.packingSingleEwhHours
    row.packingMultiEwhHours += work.packingMultiEwhHours
    row.ewhHours += work.ewhHours
    linkedWork.add(operator)
    // 预计算是否参与过各工种（用于快速过滤）
    if (work.pickingUnits && work.pickingUnits > 0) row.hasPicked = true
    if ((work.packingSingleUnits && work.packingSingleUnits > 0) || (work.packingMultiUnits && work.packingMultiUnits > 0)) row.hasPacked = true
    if (work.sortingUnits && work.sortingUnits > 0) row.hasSorted = true
  }

  if (attendanceReport?.stats?.length) {
    attendanceReport.stats.forEach((stat) => {
      const key = normalizeName(stat.operator)
      if (!key) return
      const baseName = attendanceNameByKey.get(key) || String(stat.operator || '').trim()
      const row = ensureRow(key, baseName)
      row.attendanceHours = Number(stat.ewhHours || 0)
      row.shiftType = stat.shiftType || row.shiftType
      row.attendanceName = baseName
    })
  }

  Object.entries(nameMap || {}).forEach(([att, work]) => {
    const key = normalizeName(att)
    if (!key) return
    const baseName = attendanceNameByKey.get(key) || String(att || '').trim()
    const row = ensureRow(key, baseName)
    row.attendanceName = baseName
    if (work) attachWork(row, work)
    if (work && baseName) row.name = `${baseName}(${work})`
  })

  const workByKey = new Map()
  workData.forEach((_, operator) => {
    const key = normalizeWorkKey(operator)
    if (!key) return
    if (!workByKey.has(key)) workByKey.set(key, [])
    workByKey.get(key).push(operator)
  })

  rows.forEach((row, key) => {
    if (row.sources.size) return
    const operators = workByKey.get(key)
    if (!operators || operators.length === 0) return
    operators.forEach((operator) => attachWork(row, operator))
  })

  workData.forEach((_, operator) => {
    if (linkedWork.has(operator)) return
    const mappedName = reverseNameMap.get(normalizeWorkKey(operator))
    const baseKey = mappedName ? normalizeName(mappedName) : normalizeWorkKey(operator)
    if (!baseKey) return
    const baseName =
      mappedName || attendanceNameByKey.get(baseKey) || String(operator || '').trim()
    const row = ensureRow(baseKey, baseName)
    if (mappedName && !row.attendanceName) row.attendanceName = mappedName
    attachWork(row, operator)
    if (mappedName && baseName) row.name = `${baseName}(${operator})`
  })

  if (combinedReport?.meta?.windowStart) {
    const start = new Date(combinedReport.meta.windowStart)
    const noon = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0, 0)
    workSegmentsByKey.forEach((segments, key) => {
      const row = rows.get(key)
      if (!row || row.shiftType) return
      let amMinutes = 0
      let pmMinutes = 0
      segments.forEach((seg) => {
        const segStart = new Date(seg.start)
        const segEnd = new Date(seg.end)
        if (segEnd <= segStart) return
        if (segEnd <= noon) {
          amMinutes += (segEnd - segStart) / 60000
          return
        }
        if (segStart >= noon) {
          pmMinutes += (segEnd - segStart) / 60000
          return
        }
        amMinutes += (noon - segStart) / 60000
        pmMinutes += (segEnd - noon) / 60000
      })
      if (amMinutes === 0 && pmMinutes === 0) return
      row.shiftType = amMinutes >= pmMinutes ? '早班' : '晚班'
    })
  }

  // 计算并缓存前端的“综合分”：拣货 1.0、单品打包 0.8、多品打包 0.5、分拨 0.3
  rows.forEach((row) => {
    const picking = Number(row.pickingUnits || 0)
    const packingSingle = Number(row.packingSingleUnits || 0)
    const packingMulti = Number(row.packingMultiUnits || 0)
    const sorting = Number(row.sortingUnits || 0)
    const score = picking * 1.0 + packingSingle * 0.8 + packingMulti * 0.5 + sorting * 0.3
    // 使用考勤系统的总工时（attendanceHours）归一化：综合分 = 总分 / attendanceHours
    // 若无考勤或工时为 0，则显示为 null（页面会渲染为 --）
    const attendanceHours = Number(row.attendanceHours || 0)
    if (attendanceHours > 0) {
      row.compositeScore = Math.round((score / attendanceHours) * 100) / 100
    } else {
      row.compositeScore = null
    }
  })

  return Array.from(rows.values())
}

const buildStartTimeMap = (report, nameMap, stageType) => {
  const map = new Map()
  if (!report?.segments) return map
  const reverse = new Map()
  Object.entries(nameMap || {}).forEach(([att, work]) => {
    const key = normalizeWorkKey(work)
    if (key) reverse.set(key, att)
  })
  const targetTypes =
    stageType === 'all'
      ? new Set(['picking', 'sorting', 'packing', 'work'])
      : new Set([stageType, 'work'])
  Object.entries(report.segments).forEach(([operator, segs]) => {
    const mappedName = reverse.get(normalizeWorkKey(operator)) || operator
    const hasMapped = reverse.get(normalizeWorkKey(operator))
    const key = hasMapped ? normalizeName(mappedName) : normalizeWorkKey(operator)
    if (!key) return
    const earliest = (segs || [])
      .filter((seg) => targetTypes.has(seg.type))
      .reduce((min, seg) => {
        const t = new Date(seg.start).getTime()
        return Number.isFinite(t) && t < min ? t : min
      }, Number.POSITIVE_INFINITY)
    if (Number.isFinite(earliest) && earliest !== Number.POSITIVE_INFINITY) {
      const current = map.get(key)
      if (!current || earliest < current) map.set(key, earliest)
      if (hasMapped) {
        const workKey = normalizeWorkKey(operator)
        if (workKey && (!map.get(workKey) || earliest < map.get(workKey))) {
          map.set(workKey, earliest)
        }
      }
    }
  })
  return map
}

export default App
