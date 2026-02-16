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
    '件 / 小时': 'units / hr',
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
    '第一枪': 'First Gun',
    '有效工时': 'EWH',
    '工时': 'Hours',
    '加班': 'OT',
    '所属组': 'Team',
    '工作时间占比': 'Ratio',
    '状态': 'Status',
    '出库总工时': 'Outbound total hours',
    'ObPunch导出': 'From ObPunch export',
    '等待ObPunch数据': 'Waiting for ObPunch data',
    '待上传': 'Waiting',
    '正常': 'OK',
    '异常': 'Issue',
    '匹配异常': 'Match Issue',
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
    '报告中心': 'Report Center',
    '报告类型': 'Report Type',
    '单个员工报告': 'Single Employee',
    '整个岗位报告（含时间线）': 'Role Report (with timeline)',
    '选择员工': 'Select Employee',
    '生成预览': 'Preview',
    '打印报告': 'Print',
    '生成': 'Generate',
    '请先选择员工': 'Please select an employee first',
    '报告生成失败，请允许弹窗后重试。': 'Failed to open report window. Please allow pop-ups and retry.',
    '生成中': 'Generating',
    '正在生成日报，请稍候…': 'Generating report, please wait...',
    '报告摘要': 'Summary',
    '时间线': 'Timeline',
    '筛选条件': 'Filters',
    '仅异常': 'Abnormal only',
    '是': 'Yes',
    '否': 'No',
    '记录数': 'Rows',
    '员工报告': 'Employee Report',
    '岗位报告': 'Role Report',
    '岗位': 'Role',
    '最近30天': 'Last 30 days',
    '数据天数': 'Days with data',
    '平均时效': 'Avg UPH',
    '平均占比': 'Avg Ratio',
    '日期': 'Date',
    '趋势图': 'Trend',
    '起止': 'Period',
    '时长(分钟)': 'Duration (min)',
    '员工时间线': 'Employee Timeline',
    '岗位时间线': 'Role Timeline',
    '加载中': 'Loading',
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
    '白班出库完成件数': 'Day shift packed units',
    '夜班出库完成件数': 'Night shift packed units',
    '出库UPH': 'Outbound UPH',
    '件数/工时（含白名单）': 'Units / hours (incl. whitelist)',
    '拣货为主': 'Picking-first',
    '分拨为主': 'Sorting-first',
    '打包为主': 'Packing-first',
    '明细': 'Detail',
    '请选择日期': 'Select date',
    '账号关联（全局）': 'Account Link (Global)',
    '人员匹配（以考勤姓名为主）': 'Name Match (Attendance-first)',
    '考勤内未作业': 'Idle within attendance',
    '打包(单品)': 'Packing (Single)',
    '打包(多品)': 'Packing (Multi)',
    '分钟': 'min',
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
const MIN_ATTENDANCE_HOURS = 0.5

const isAttendanceHoursReliable = (hours) => {
  const h = Number(hours || 0)
  return Number.isFinite(h) && h >= MIN_ATTENDANCE_HOURS
}

const calcWorkRatioPercent = (ewhHours, attendanceHours) =>
  isAttendanceHoursReliable(attendanceHours)
    ? (Number(ewhHours || 0) / Number(attendanceHours || 0)) * 100
    : null

const getDominantStageKey = (person) => {
  const picking = Number(person?.pickingUnits || 0)
  const packing = Number(person?.packingSingleUnits || 0) + Number(person?.packingMultiUnits || 0)
  const sorting = Number(person?.sortingUnits || 0)
  const max = Math.max(picking, packing, sorting)
  if (max <= 0) return ''
  // 平票时按拣货 > 打包 > 分拨，保证结果稳定。
  if (picking === max) return 'picking'
  if (packing === max) return 'packing'
  return 'sorting'
}

const getDominantGroupLabel = (person, t) => {
  const key = getDominantStageKey(person)
  if (key === 'picking') return t('拣货')
  if (key === 'packing') return t('打包')
  if (key === 'sorting') return t('分拨')
  return '--'
}

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
  const [accountLinkDraftMap, setAccountLinkDraftMap] = useState({})
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
  const [settingsDraft, setSettingsDraft] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  const [showAccountLink, setShowAccountLink] = useState(false)
  const [showWhitelist, setShowWhitelist] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [reportPreviewTitle, setReportPreviewTitle] = useState('')
  const [reportPreviewHtml, setReportPreviewHtml] = useState('')
  const [reportType, setReportType] = useState('single')
  const [reportEmployeeName, setReportEmployeeName] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportEmployeeOptions, setReportEmployeeOptions] = useState([])
  const [reportEmployeeOptionsLoading, setReportEmployeeOptionsLoading] = useState(false)
  const [globalWorkAccounts, setGlobalWorkAccounts] = useState([])
  const [whitelistUnlocked, setWhitelistUnlocked] = useState(false)
  const [whitelistInput, setWhitelistInput] = useState('')
  const [whitelistRoleInput, setWhitelistRoleInput] = useState('组长')
  const [accountLinkSearch, setAccountLinkSearch] = useState('')
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
  const reportPreviewRef = useRef(null)
  const reportEmployeePoolCacheRef = useRef(new Map())
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
  const packingKpi = buildSortingKpi(packingReport)
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
  const bannerPackingShiftStats = useMemo(() => {
    const dayStartBase = new Date(attendanceReport?.meta?.windowStart || '').getTime()
    const fallbackStart = selectedDate
      ? new Date(`${selectedDate}T05:00:00`).getTime()
      : Number.NaN
    const windowStart = Number.isFinite(dayStartBase) ? dayStartBase : fallbackStart
    const windowEnd = Number.isFinite(windowStart) ? windowStart + 24 * 60 * 60 * 1000 : Number.NaN
    if (!Number.isFinite(windowStart) || !Number.isFinite(windowEnd)) {
      return { dayUnits: 0, nightUnits: 0, dayHours: 0, nightHours: 0, dayUph: null, nightUph: null }
    }
    const nightStart = windowStart + 10.5 * 60 * 60 * 1000 // 15:30（你提到夜班有 15:30/16:30 两种开班）
    const overlapMs = (aStart, aEnd, bStart, bEnd) =>
      Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))

    let dayUnitsRaw = 0
    let nightUnitsRaw = 0
    let dayHours = 0
    let nightHours = 0

    // 件数：按每人 totalUnits 分配到白/夜，避免 segment 丢失孤立扫描点导致总数对不上。
    const attendanceFirstStartByKey = new Map()
    Object.entries(attendanceReport?.segments || {}).forEach(([name, segs]) => {
      const key = normalizeName(name)
      if (!key) return
      const first = (segs || []).reduce((min, seg) => {
        if (seg?.type !== 'attendance') return min
        const t = new Date(seg.start).getTime()
        return Number.isFinite(t) && t < min ? t : min
      }, Number.POSITIVE_INFINITY)
      if (Number.isFinite(first) && first !== Number.POSITIVE_INFINITY) {
        const prev = attendanceFirstStartByKey.get(key)
        if (!Number.isFinite(prev) || first < prev) attendanceFirstStartByKey.set(key, first)
      }
    })
    ;(packingReport?.stats || []).forEach((stat) => {
      const totalUnits = Number(stat?.totalUnits || 0)
      if (!(totalUnits > 0)) return
      const operator = String(stat?.operator || '')
      const segs = packingReport?.segments?.[operator] || []
      let dayMsTotal = 0
      let nightMsTotal = 0
      let firstWorkStart = Number.POSITIVE_INFINITY
      ;(segs || []).forEach((seg) => {
        if (seg?.type !== 'work') return
        const segStart = new Date(seg.start).getTime()
        const segEnd = new Date(seg.end).getTime()
        if (!Number.isFinite(segStart) || !Number.isFinite(segEnd) || segEnd <= segStart) return
        if (segStart < firstWorkStart) firstWorkStart = segStart
        const start = Math.max(segStart, windowStart)
        const end = Math.min(segEnd, windowEnd)
        if (end <= start) return
        const dayMs = overlapMs(start, end, windowStart, nightStart)
        const nightMs = overlapMs(start, end, nightStart, windowEnd)
        if (dayMs > 0) dayMsTotal += dayMs
        if (nightMs > 0) nightMsTotal += nightMs
      })
      const msSum = dayMsTotal + nightMsTotal
      if (msSum > 0) {
        dayUnitsRaw += totalUnits * (dayMsTotal / msSum)
        nightUnitsRaw += totalUnits * (nightMsTotal / msSum)
        return
      }
      const key = normalizeName(operator)
      const fallbackStart = Number.isFinite(firstWorkStart)
        ? firstWorkStart
        : attendanceFirstStartByKey.get(key)
      if (Number.isFinite(fallbackStart) && fallbackStart >= nightStart) {
        nightUnitsRaw += totalUnits
      } else {
        dayUnitsRaw += totalUnits
      }
    })

    // 工时：直接按考勤 attendance 片段与白/夜时间窗重叠累加（包含白名单，不做过滤）。
    Object.values(attendanceReport?.segments || {}).forEach((segs) => {
      ;(segs || []).forEach((seg) => {
        if (seg?.type !== 'attendance') return
        const segStart = new Date(seg.start).getTime()
        const segEnd = new Date(seg.end).getTime()
        if (!Number.isFinite(segStart) || !Number.isFinite(segEnd) || segEnd <= segStart) return
        const start = Math.max(segStart, windowStart)
        const end = Math.min(segEnd, windowEnd)
        if (end <= start) return
        const dayMs = overlapMs(start, end, windowStart, nightStart)
        const nightMs = overlapMs(start, end, nightStart, windowEnd)
        if (dayMs > 0) dayHours += dayMs / 3600000
        if (nightMs > 0) nightHours += nightMs / 3600000
      })
    })
    // 让白+夜严格对齐全天打包总件数（避免四舍五入造成差 1）。
    const totalUnitsAll = Number(packingReport?.kpi?.totalUnitsAll || 0)
    const dayUnits = Math.round(dayUnitsRaw)
    const nightUnits =
      totalUnitsAll > 0
        ? Math.max(0, totalUnitsAll - dayUnits)
        : Math.round(nightUnitsRaw)
    const dayUph = dayHours > 0 ? dayUnits / dayHours : null
    const nightUph = nightHours > 0 ? nightUnits / nightHours : null
    return { dayUnits, nightUnits, dayHours, nightHours, dayUph, nightUph }
  }, [packingReport, attendanceReport, selectedDate])
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
  const attendanceStartMap = useMemo(() => {
    const map = new Map()
    attendanceWindowMap.forEach((windows, key) => {
      const earliest = (windows || []).reduce((min, seg) => {
        const t = Number(seg?.start)
        return Number.isFinite(t) && t < min ? t : min
      }, Number.POSITIVE_INFINITY)
      if (Number.isFinite(earliest) && earliest !== Number.POSITIVE_INFINITY) {
        map.set(key, earliest)
      }
    })
    return map
  }, [attendanceWindowMap])
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
  const accountLinkOptions = useMemo(
    () => (globalWorkAccounts.length ? globalWorkAccounts : workNames).slice().sort((a, b) => a.localeCompare(b, locale)),
    [globalWorkAccounts, workNames, locale]
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
    const mapForPanel = showAccountLink ? accountLinkDraftMap : accountLinkMap
    const linked = attendanceNames.filter((name) => Boolean(mapForPanel[name]))
    const unresolved = attendanceNames.filter((name) => {
      if (mapForPanel[name]) return false
      const key = normalizeName(name)
      return key && !workKeySet.has(key)
    })
    return Array.from(new Set([...unresolved, ...linked])).sort((a, b) =>
      a.localeCompare(b, 'zh-Hans-CN')
    )
  }, [attendanceNames, accountLinkMap, accountLinkDraftMap, showAccountLink, workKeySet])
  const debouncedAccountLinkSearch = useDebouncedValue(accountLinkSearch, 180)
  const accountLinkSearchKey = useMemo(
    () => normalizeName(debouncedAccountLinkSearch),
    [debouncedAccountLinkSearch]
  )
  const filteredAccountLinkPanelNames = useMemo(() => {
    if (!accountLinkSearchKey) return accountLinkPanelNames
    return accountLinkPanelNames.filter((name) =>
      normalizeName(name).includes(accountLinkSearchKey)
    )
  }, [accountLinkPanelNames, accountLinkSearchKey])
  const accountLinkRenderNames = useMemo(() => {
    const base =
      selectedMatchName && filteredAccountLinkPanelNames.includes(selectedMatchName)
        ? [selectedMatchName]
        : filteredAccountLinkPanelNames
    if (accountLinkSearchKey || selectedMatchName) return base
    return base.slice(0, 160)
  }, [filteredAccountLinkPanelNames, selectedMatchName, accountLinkSearchKey])
  const accountLinkHiddenCount = useMemo(() => {
    if (accountLinkSearchKey || selectedMatchName) return 0
    return Math.max(0, filteredAccountLinkPanelNames.length - accountLinkRenderNames.length)
  }, [filteredAccountLinkPanelNames, accountLinkRenderNames, selectedMatchName, accountLinkSearchKey])
  const accountLinkOptionList = useMemo(() => {
    const merged = new Set(accountLinkOptions)
    Object.values(showAccountLink ? accountLinkDraftMap : accountLinkMap).forEach((value) => {
      if (value) merged.add(value)
    })
    return Array.from(merged).sort((a, b) => a.localeCompare(b, locale))
  }, [accountLinkOptions, accountLinkMap, accountLinkDraftMap, showAccountLink, locale])
  const filteredDetailRows = useMemo(
    () =>
      detailRows.filter((person) => {
        if (detailOnlyAbnormal) {
          if (!person.attendanceName) return false
          if (!attendanceNameSet.has(normalizeName(person.attendanceName))) return false
          const ratio = calcWorkRatioPercent(person.ewhHours, person.attendanceHours)
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

    const startMap = startTimeMaps.all

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

    const getFirstGunMinutes = (person) => {
      const startKey = person.attendanceName
        ? normalizeName(person.attendanceName)
        : person.workKey
          ? person.workKey
          : person.sources && person.sources.size
            ? normalizeWorkKey(Array.from(person.sources)[0])
            : normalizeName(person.name)
      const startMs = getStartMs(person)
      const attendanceStartMs = attendanceStartMap.get(startKey)
      if (!Number.isFinite(startMs) || !Number.isFinite(attendanceStartMs)) return null
      return Math.max(0, Math.round((startMs - attendanceStartMs) / 60000))
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

    const getRatio = (person) => calcWorkRatioPercent(person.ewhHours, person.attendanceHours)

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
          return getFirstGunMinutes(person)
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
      if (detailSortKey === 'start') {
        if (av == null && bv == null) {
          return String(a.name || '').localeCompare(String(b.name || ''), locale, {
            sensitivity: 'base',
          })
        }
        if (av == null) return 1
        if (bv == null) return -1
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
  }, [filteredDetailRows, detailSortKey, detailSortDir, detailStageFilter, startTimeMaps, attendanceStartMap, locale])

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

  useEffect(() => {
    if (!showReportDialog) return
    if (reportEmployeeName) return
    if (!reportEmployeeOptions.length) return
    setReportEmployeeName(reportEmployeeOptions[0])
  }, [showReportDialog, reportEmployeeOptions])

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
    const loadGlobalWorkAccounts = async () => {
      try {
        const response = await fetch('/api/work-accounts')
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.accounts)) {
          setGlobalWorkAccounts(data.accounts.filter(Boolean))
        }
      } catch (error) {
        // ignore
      }
    }
    loadGlobalWorkAccounts()
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
        ? t('考勤内未作业')
        : seg.stage === 'picking'
        ? t('拣货')
        : seg.stage === 'sorting'
          ? t('分拨')
          : seg.stage === 'packing'
            ? seg.type === 'packing-single'
              ? t('打包(单品)')
              : seg.type === 'packing-multi'
                ? t('打包(多品)')
                : t('打包')
            : t('非作业')
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
          ? ` · ${t('件数')} ${units}`
          : ''
    const durationText = ` · ${duration}${t('分钟')}`
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

  const openSettingsPanel = () => {
    setSettingsDraft(quickLinks.map((item) => ({ ...item })))
    setShowSettings(true)
  }

  const closeSettingsPanel = () => {
    setQuickLinks(
      (settingsDraft.length ? settingsDraft : quickLinks).map((item) => ({
        label: item?.label || '',
        url: item?.url || '',
      }))
    )
    setShowSettings(false)
  }

  const updateQuickLink = (index, field, value) => {
    setSettingsDraft((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const applyAccountLinkChange = (prev, sourceName, targetName) => {
    const next = { ...prev }
    if (!targetName) {
      delete next[sourceName]
      return next
    }
    Object.keys(next).forEach((key) => {
      if (next[key] === targetName && key !== sourceName) delete next[key]
    })
    next[sourceName] = targetName
    return next
  }

  const openAccountLinkPanel = () => {
    setSelectedMatchName('')
    setAccountLinkSearch('')
    setAccountLinkDraftMap({ ...accountLinkMap })
    setShowAccountLink(true)
  }

  const closeAccountLinkPanel = async () => {
    const previous = accountLinkMap
    const next = accountLinkDraftMap
    setAccountLinkMap(next)
    setShowAccountLink(false)
    const changedSources = Array.from(
      new Set([...Object.keys(previous), ...Object.keys(next)])
    ).filter((sourceName) => (previous[sourceName] || '') !== (next[sourceName] || ''))
    if (!changedSources.length) return
    await Promise.all(
      changedSources.map((sourceName) => {
        const targetName = next[sourceName] || ''
        if (!targetName) {
          return fetch(`/api/account-links?sourceName=${encodeURIComponent(sourceName)}`, {
            method: 'DELETE',
          }).catch(() => null)
        }
        return fetch('/api/account-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceName, targetName }),
        }).catch(() => null)
      })
    )
  }

  const updateAccountLinkDraft = (sourceName, targetName) => {
    setAccountLinkDraftMap((prev) => applyAccountLinkChange(prev, sourceName, targetName))
  }

  const updateAccountLinkMap = async (sourceName, targetName) => {
    setAccountLinkMap((prev) => applyAccountLinkChange(prev, sourceName, targetName))
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

  const getReportStartMap = () =>
    detailStageFilter === 'picking'
      ? startTimeMaps.picking
      : detailStageFilter === 'sorting'
        ? startTimeMaps.sorting
        : detailStageFilter === 'packing'
          ? startTimeMaps.packing
          : startTimeMaps.all

  const getReportStartLabel = (person) => {
    const startMap = getReportStartMap()
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
      : '--'
  }

  const getReportUnitsForStage = (person) => {
    if (detailStageFilter === 'picking') return Number(person.pickingUnits || 0)
    if (detailStageFilter === 'sorting') return Number(person.sortingUnits || 0)
    if (detailStageFilter === 'packing') {
      return Number(person.packingSingleUnits || 0) + Number(person.packingMultiUnits || 0)
    }
    return (
      Number(person.pickingUnits || 0) +
      Number(person.sortingUnits || 0) +
      Number(person.packingSingleUnits || 0) +
      Number(person.packingMultiUnits || 0)
    )
  }

  const getReportEwhForStage = (person) => {
    if (detailStageFilter === 'picking') return Number(person.pickingEwhHours || 0)
    if (detailStageFilter === 'sorting') return Number(person.sortingEwhHours || 0)
    if (detailStageFilter === 'packing') {
      return (
        Number(person.packingSingleEwhHours || 0) + Number(person.packingMultiEwhHours || 0)
      )
    }
    return Number(person.ewhHours || 0)
  }

  const getReportStatus = (person) => {
    const ratio = calcWorkRatioPercent(person.ewhHours, person.attendanceHours)
    const whitelistRole = getWhitelistRole(person)
    const whitelistExempt = isWhitelistExempt(whitelistRole)
    const forcedIssue = whitelistRole === '异常'
    const matchIssue =
      !whitelistExempt &&
      hasAttendanceData &&
      (!person.attendanceMatched || person.attendanceHours <= 0)
    const ratioIssue = !whitelistExempt && ratio !== null && (ratio < 75 || ratio > 100)
    const waitingAttendance = !hasAttendanceData && person.ewhHours > 0
    const matchedByManual = person.attendanceName && effectiveNameMap[person.attendanceName]
    const hasIssue = forcedIssue || matchIssue || ratioIssue
    return whitelistRole
      ? t(whitelistRole)
      : waitingAttendance
        ? t('待上传')
        : matchIssue
          ? t('匹配异常')
          : hasIssue
            ? t('异常')
            : matchedByManual
              ? t('已匹配')
              : t('正常')
  }

  const escapeHtml = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  const toTimelineClock = (minutes) => {
    const total = Math.round(Number(minutes || 0))
    const hh = Math.floor((total % 1440) / 60)
    const mm = total % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }

  const getSegLabel = (seg) => {
    if (seg.stage === 'attendance') return t('考勤内未作业')
    if (seg.stage === 'picking') return t('拣货')
    if (seg.stage === 'sorting') return t('分拨')
    if (seg.stage === 'packing') {
      if (seg.type === 'packing-single') return t('打包(单品)')
      if (seg.type === 'packing-multi') return t('打包(多品)')
      return t('打包')
    }
    return t('非作业')
  }

  const getSegColor = (seg) => {
    if (seg.stage === 'picking') return '#4f8cff'
    if (seg.stage === 'sorting') return '#44b98f'
    if (seg.stage === 'packing') return '#f6b54b'
    if (seg.stage === 'attendance') return '#8a63d2'
    return '#e56a6a'
  }

  const renderTrackHtml = (segments = []) =>
    `<div class="track">${segments
      .map((seg) => {
        const left = ((seg.start - dayStart) / daySpan) * 100
        const width = ((seg.end - seg.start) / daySpan) * 100
        return `<span class="seg" style="left:${left}%;width:${Math.max(width, 0.2)}%;background:${getSegColor(
          seg
        )};"></span>`
      })
      .join('')}</div>`

  const renderTimelineRowsHtml = (rows = []) =>
    rows
      .map((row) => {
        const segments = row.segments || []
        const detailRowsHtml = segments
          .map((seg) => {
            const minutes = Math.max(0, Math.round(seg.end - seg.start))
            return `<tr><td>${escapeHtml(getSegLabel(seg))}</td><td>${escapeHtml(
              `${toTimelineClock(seg.start)} - ${toTimelineClock(seg.end)}`
            )}</td><td>${minutes}</td></tr>`
          })
          .join('')
        return `<div class="timeline-person">
          <div class="timeline-head"><strong>${escapeHtml(row.name)}</strong>${renderTrackHtml(
          segments
        )}</div>
          <table class="tiny-table">
            <thead><tr><th>${escapeHtml(t('状态'))}</th><th>${escapeHtml(t('起止'))}</th><th>${escapeHtml(
          t('时长(分钟)')
        )}</th></tr></thead>
            <tbody>${detailRowsHtml || `<tr><td colspan="3">--</td></tr>`}</tbody>
          </table>
        </div>`
      })
      .join('')

  const renderSingleReportAreaChartHtml = (rows = []) => {
    const ordered = rows
      .filter((row) => row.eff !== null || row.score !== null)
      .sort((a, b) => (a.dateKey > b.dateKey ? 1 : -1))
    if (!ordered.length) return `<div class="card">--</div>`

    const width = 820
    const height = 240
    const pad = 28
    const innerW = width - pad * 2
    const innerH = height - pad * 2
    const maxValue = Math.max(
      1,
      ...ordered.flatMap((row) => [row.eff || 0, row.score || 0])
    )
    const xAt = (idx) =>
      ordered.length === 1 ? pad + innerW / 2 : pad + (idx / (ordered.length - 1)) * innerW
    const yAt = (value) => pad + innerH - (Number(value || 0) / maxValue) * innerH

    const buildSeries = (getter) =>
      ordered
        .map((row, idx) => {
          const value = getter(row)
          return value === null ? null : { x: xAt(idx), y: yAt(value), value }
        })
        .filter(Boolean)

    const uphSeries = buildSeries((row) => row.eff)
    const scoreSeries = buildSeries((row) => row.score)
    const toPoints = (series) => series.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const toAreaPath = (series) => {
      if (!series.length) return ''
      const first = series[0]
      const last = series[series.length - 1]
      const line = toPoints(series)
      return `M ${first.x.toFixed(1)} ${(
        pad + innerH
      ).toFixed(1)} L ${line.replaceAll(',', ' ')} L ${last.x.toFixed(1)} ${(
        pad + innerH
      ).toFixed(1)} Z`
    }

    const startLabel = ordered[0]?.dateKey || ''
    const endLabel = ordered[ordered.length - 1]?.dateKey || ''

    return `
      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:10px;background:#fff">
        <div style="display:flex;gap:14px;align-items:center;font-size:12px;margin-bottom:6px">
          <span style="display:inline-flex;align-items:center;gap:6px"><i style="display:inline-block;width:10px;height:10px;background:#f59e0b;border-radius:50%"></i>${escapeHtml(
            t('时效')
          )}</span>
          <span style="display:inline-flex;align-items:center;gap:6px"><i style="display:inline-block;width:10px;height:10px;background:#3b82f6;border-radius:50%"></i>${escapeHtml(
            t('综合分')
          )}</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" width="100%" height="240" role="img" aria-label="UPH and Composite Score Trend">
          <rect x="${pad}" y="${pad}" width="${innerW}" height="${innerH}" fill="#f8fafc" stroke="#e5e7eb"/>
          <path d="${toAreaPath(uphSeries)}" fill="rgba(245,158,11,0.24)"></path>
          <polyline points="${toPoints(uphSeries)}" fill="none" stroke="#f59e0b" stroke-width="2"></polyline>
          <path d="${toAreaPath(scoreSeries)}" fill="rgba(59,130,246,0.2)"></path>
          <polyline points="${toPoints(scoreSeries)}" fill="none" stroke="#3b82f6" stroke-width="2"></polyline>
          <text x="${pad}" y="${height - 8}" font-size="11" fill="#6b7280">${escapeHtml(startLabel)}</text>
          <text x="${width - pad}" y="${height - 8}" text-anchor="end" font-size="11" fill="#6b7280">${escapeHtml(
      endLabel
    )}</text>
        </svg>
      </div>
    `
  }

  const openReportWindow = (title, html, printNow = false) => {
    setReportPreviewTitle(title)
    setReportPreviewHtml(html)
    setShowReportPreview(true)
    if (printNow) {
      setTimeout(() => {
        const iframeWin = reportPreviewRef.current?.contentWindow
        if (iframeWin) {
          iframeWin.focus()
          iframeWin.print()
        }
      }, 250)
    }
  }

  const buildReportHtml = (title, summaryHtml, tableHtml, timelineHtml) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#1f2937}
      h1{font-size:24px;margin:0 0 6px}
      h2{font-size:16px;margin:20px 0 10px}
      .meta{color:#6b7280;font-size:12px;margin-bottom:10px}
      .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}
      .card{border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;background:#fafafa}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left}
      th{background:#f3f4f6}
      .timeline-person{margin-bottom:14px}
      .timeline-head{display:grid;grid-template-columns:220px 1fr;align-items:center;gap:8px;margin-bottom:6px}
      .track{position:relative;height:14px;background:#eef2f7;border-radius:99px;overflow:hidden}
      .seg{position:absolute;top:0;height:100%}
      .tiny-table th,.tiny-table td{font-size:11px;padding:4px 6px}
      @media print { body{margin:10mm} }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <h2>${escapeHtml(t('报告摘要'))}</h2>
    <div class="summary">${summaryHtml}</div>
    <h2>${escapeHtml(t('人员明细'))}</h2>
    ${tableHtml}
    <h2>${escapeHtml(t('时间线'))}</h2>
    ${timelineHtml}
  </body>
</html>`

  const buildRecentDateKeys = (endDateKey, days = 30) => {
    const [y, m, d] = String(endDateKey || '')
      .split('-')
      .map(Number)
    const base = new Date(y, (m || 1) - 1, d || 1)
    if (Number.isNaN(base.getTime())) return []
    const keys = []
    for (let i = 0; i < days; i += 1) {
      const cur = new Date(base)
      cur.setDate(base.getDate() - i)
      keys.push(toDateKey(cur))
    }
    return keys
  }

  const fetchReportByStage = async (stage, dateKey) => {
    try {
      const response = await fetch(`/api/reports/${stage}?date=${dateKey}`)
      if (!response.ok) return null
      const data = await response.json()
      return data?.report || null
    } catch (error) {
      return null
    }
  }

  const fetchAllReportsByDate = async (dateKey) => {
    const [picking, sorting, packing, attendance] = await Promise.all([
      fetchReportByStage('picking', dateKey),
      fetchReportByStage('sorting', dateKey),
      fetchReportByStage('packing', dateKey),
      fetchReportByStage('attendance', dateKey),
    ])
    return { picking, sorting, packing, attendance }
  }

  useEffect(() => {
    if (!showReportDialog || reportType !== 'single') return
    let cancelled = false
    const loadEmployeePool = async () => {
      const cacheKey = `${selectedDate}:30`
      if (reportEmployeePoolCacheRef.current.has(cacheKey)) {
        const cached = reportEmployeePoolCacheRef.current.get(cacheKey) || []
        setReportEmployeeOptions(cached)
        if (!reportEmployeeName && cached.length) setReportEmployeeName(cached[0])
        return
      }
      setReportEmployeeOptionsLoading(true)
      try {
        let list = []
        try {
          const response = await fetch(
            `/api/report-employees?date=${encodeURIComponent(selectedDate)}&days=30`
          )
          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data?.employees)) {
              list = data.employees.filter(Boolean)
            }
          }
        } catch (error) {
          // ignore and fallback below
        }
        if (!list.length) {
          const dateKeys = buildRecentDateKeys(selectedDate, 30)
          const datasets = await Promise.all(dateKeys.map((dateKey) => fetchAllReportsByDate(dateKey)))
          if (cancelled) return
          const names = new Set()
          datasets.forEach((set) => {
            const combined = buildCombinedReport(set.picking, set.sorting, set.packing)
            const rows = buildDetailRows(
              combined,
              set.picking,
              set.sorting,
              set.packing,
              set.attendance,
              effectiveNameMap
            )
            rows.forEach((row) => {
              const name = String(row?.name || '').trim()
              if (name) names.add(name)
            })
          })
          list = Array.from(names)
        }
        list = list.sort((a, b) => a.localeCompare(b, locale))
        if (cancelled) return
        setReportEmployeeOptions(list)
        reportEmployeePoolCacheRef.current.set(cacheKey, list)
        if (!reportEmployeeName && list.length) {
          setReportEmployeeName(list[0])
        } else if (reportEmployeeName && !list.includes(reportEmployeeName)) {
          setReportEmployeeName('')
        }
      } finally {
        if (!cancelled) setReportEmployeeOptionsLoading(false)
      }
    }
    loadEmployeePool()
    return () => {
      cancelled = true
    }
  }, [showReportDialog, reportType, selectedDate, locale, effectiveNameMap])

  const handleGenerateReport = async (printNow = false) => {
    if (reportLoading) return
    if (!sortedDetailRows.length) {
      alert(t('暂无数据'))
      return
    }
    if (reportType === 'single' && !reportEmployeeName) {
      alert(t('请先选择员工'))
      return
    }

    if (reportType === 'single') {
      setReportLoading(true)
      try {
        const dateKeys = buildRecentDateKeys(selectedDate, 30)
        const targetKey = normalizeName(reportEmployeeName)
        const datasets = await Promise.all(dateKeys.map((dateKey) => fetchAllReportsByDate(dateKey)))

        const dayRows = []
        datasets.forEach((set, idx) => {
          const dateKey = dateKeys[idx]
          const combined = buildCombinedReport(set.picking, set.sorting, set.packing)
          if (!combined && !set.attendance) return
          const rows = buildDetailRows(
            combined,
            set.picking,
            set.sorting,
            set.packing,
            set.attendance,
            effectiveNameMap
          )
          const person = rows.find((row) => {
            const n1 = normalizeName(row.name)
            const n2 = normalizeName(row.attendanceName)
            return n1 === targetKey || n2 === targetKey
          })
          if (!person) return

          const startMap = buildStartTimeMap(combined, effectiveNameMap, 'all')
          const startKey = person.attendanceName
            ? normalizeName(person.attendanceName)
            : person.workKey || normalizeName(person.name)
          const startMs = startMap.get(startKey)
          const startLabel = Number.isFinite(startMs)
            ? new Date(startMs).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
            : '--'
          const dominantStage = getDominantStageKey(person)
          const units =
            dominantStage === 'picking'
              ? Number(person.pickingUnits || 0)
              : dominantStage === 'sorting'
                ? Number(person.sortingUnits || 0)
                : dominantStage === 'packing'
                  ? Number(person.packingSingleUnits || 0) + Number(person.packingMultiUnits || 0)
                  : 0
          const ewh =
            dominantStage === 'picking'
              ? Number(person.pickingEwhHours || 0)
              : dominantStage === 'sorting'
                ? Number(person.sortingEwhHours || 0)
                : dominantStage === 'packing'
                  ? Number(person.packingSingleEwhHours || 0) + Number(person.packingMultiEwhHours || 0)
                  : 0
          const hours = Number(person.attendanceHours || 0)
          const eff = ewh > 0 ? units / ewh : null
          const ratio = calcWorkRatioPercent(ewh, hours)
          dayRows.push({
            dateKey,
            personName: person.name || reportEmployeeName,
            startLabel,
            ewh,
            hours,
            units,
            eff,
            ratio,
            score: typeof person.compositeScore === 'number' ? person.compositeScore : null,
            status: getReportStatus(person),
          })
        })

        const sortedDays = dayRows.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
        const totals = sortedDays.reduce(
          (acc, row) => {
            acc.units += row.units
            acc.ewh += row.ewh
            if (row.ratio !== null) {
              acc.ratioSum += row.ratio
              acc.ratioCnt += 1
            }
            return acc
          },
          { units: 0, ewh: 0, ratioSum: 0, ratioCnt: 0 }
        )
        const avgUph = totals.ewh > 0 ? totals.units / totals.ewh : null

        const summaryHtml = [
          [t('人员'), reportEmployeeName || '--'],
          [t('最近30天'), `${dateKeys[dateKeys.length - 1]} ~ ${dateKeys[0]}`],
          [t('数据天数'), sortedDays.length],
          [t('件数'), totals.units],
          [t('平均时效'), avgUph == null ? '--' : avgUph.toFixed(2)],
        ]
          .map(([k, v]) => `<div class="card"><strong>${escapeHtml(k)}</strong><div>${escapeHtml(v)}</div></div>`)
          .join('')

        const tableRows = sortedDays
          .map(
            (row) => `<tr>
          <td>${escapeHtml(row.dateKey)}</td>
          <td>${escapeHtml(row.startLabel)}</td>
          <td>${escapeHtml(row.ewh.toFixed(2))}</td>
          <td>${escapeHtml(row.hours.toFixed(2))}</td>
          <td>${row.units}</td>
          <td>${escapeHtml(row.eff == null ? '--' : row.eff.toFixed(2))}</td>
          <td>${escapeHtml(row.score == null ? '--' : row.score.toFixed(2))}</td>
          <td>${escapeHtml(row.ratio == null ? '--' : `${row.ratio.toFixed(0)}%`)}</td>
          <td>${escapeHtml(row.status)}</td>
        </tr>`
          )
          .join('')

        const tableHtml = `<table><thead><tr>
          <th>${escapeHtml(t('日期'))}</th><th>${escapeHtml(t('开始工作'))}</th><th>${escapeHtml(
            t('有效工时')
          )}</th>
          <th>${escapeHtml(t('工时'))}</th><th>${escapeHtml(t('件数'))}</th><th>${escapeHtml(t('时效'))}</th>
          <th>${escapeHtml(t('综合分'))}</th><th>${escapeHtml(t('工作时间占比'))}</th><th>${escapeHtml(
            t('状态')
          )}</th>
        </tr></thead><tbody>${tableRows || `<tr><td colspan="9">--</td></tr>`}</tbody></table>`

        const title = `${t('员工报告')} - ${reportEmployeeName}`
        const timelineHtml = `<h3>${escapeHtml(t('趋势图'))}</h3>${renderSingleReportAreaChartHtml(
          sortedDays
        )}`
        openReportWindow(title, buildReportHtml(title, summaryHtml, tableHtml, timelineHtml), printNow)
        setShowReportDialog(false)
      } finally {
        setReportLoading(false)
      }
      return
    }

    const rows = sortedDetailRows
    const summaryHtml = [
      [t('岗位'), stageLabel],
      [t('记录数'), rows.length],
      [t('筛选条件'), `${teamFilter === 'all' ? t('全部班组') : t(teamFilter)} / ${t('仅异常')} ${detailOnlyAbnormal ? t('是') : t('否')}`],
      [t('件数'), rows.reduce((acc, row) => acc + getReportUnitsForStage(row), 0)],
      [t('有效工时'), rows.reduce((acc, row) => acc + Number(row.ewhHours || 0), 0).toFixed(2)],
    ]
      .map(([k, v]) => `<div class="card"><strong>${escapeHtml(k)}</strong><div>${escapeHtml(v)}</div></div>`)
      .join('')

    const tableRows = rows
      .map((person) => {
        const units = getReportUnitsForStage(person)
        const stageEwh = getReportEwhForStage(person)
        const eff = stageEwh > 0 ? units / stageEwh : null
        const ratio = calcWorkRatioPercent(person.ewhHours, person.attendanceHours)
        const dominantGroup = getDominantGroupLabel(person, t)
        return `<tr>
          <td>${escapeHtml(person.name || '--')}</td>
          <td>${escapeHtml(dominantGroup)}</td>
          <td>${escapeHtml(getReportStartLabel(person))}</td>
          <td>${escapeHtml(Number(person.ewhHours || 0).toFixed(2))}</td>
          <td>${escapeHtml(Number(person.attendanceHours || 0).toFixed(2))}</td>
          <td>${units}</td>
          <td>${escapeHtml(eff == null ? '--' : eff.toFixed(2))}</td>
          <td>${escapeHtml(typeof person.compositeScore === 'number' ? person.compositeScore.toFixed(2) : '--')}</td>
          <td>${escapeHtml(ratio == null ? '--' : `${ratio.toFixed(0)}%`)}</td>
          <td>${escapeHtml(getReportStatus(person))}</td>
        </tr>`
      })
      .join('')
    const tableHtml = `<table><thead><tr>
      <th>${escapeHtml(t('人员'))}</th><th>${escapeHtml(t('所属组'))}</th><th>${escapeHtml(t('开始工作'))}</th><th>${escapeHtml(t('有效工时'))}</th>
      <th>${escapeHtml(t('工时'))}</th><th>${escapeHtml(t('件数'))}</th><th>${escapeHtml(t('时效'))}</th>
      <th>${escapeHtml(t('综合分'))}</th><th>${escapeHtml(t('工作时间占比'))}</th><th>${escapeHtml(t('状态'))}</th>
    </tr></thead><tbody>${tableRows || `<tr><td colspan="10">--</td></tr>`}</tbody></table>`

    const timelineHtml = groupedTimeline.length
      ? groupedTimeline
          .map(
            (group) =>
              `<h3>${escapeHtml(group.label)}</h3>${renderTimelineRowsHtml(group.rows)}`
          )
          .join('')
      : `<div class="card">--</div>`
    const title = `${t('岗位报告')} - ${stageLabel}`
    openReportWindow(title, buildReportHtml(title, summaryHtml, tableHtml, timelineHtml), printNow)
    setShowReportDialog(false)
  }

  const exportDetailExcel = async () => {
    const rows = sortedDetailRows
    if (!rows.length) {
      alert(t('暂无数据'))
      return
    }

    const startMap = startTimeMaps.all

    const toStartLabel = (person) => {
      const startKey = person.attendanceName
        ? normalizeName(person.attendanceName)
        : person.workKey
          ? person.workKey
          : person.sources && person.sources.size
            ? normalizeWorkKey(Array.from(person.sources)[0])
            : normalizeName(person.name)
      const startMs = startMap.get(startKey)
      const attendanceStartMs = attendanceStartMap.get(startKey)
      if (!Number.isFinite(startMs) || !Number.isFinite(attendanceStartMs)) return ''
      return Math.max(0, Math.round((startMs - attendanceStartMs) / 60000))
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
      const ratio = calcWorkRatioPercent(person.ewhHours, person.attendanceHours)
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
          : matchIssue
            ? t('匹配异常')
            : hasIssue
              ? t('异常')
              : matchedByManual
                ? t('已匹配')
                : t('正常')
      return label
    }

    const headers = [
      t('人员'),
      t('所属组'),
      t('第一枪'),
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
      const ratioRaw = calcWorkRatioPercent(person.ewhHours, person.attendanceHours)
      const ratio = ratioRaw === null ? '' : ratioRaw
      const status = computeStatus(person)
      const score = typeof person.compositeScore === 'number' ? person.compositeScore : ''
      const dominantGroup = getDominantGroupLabel(person, t)

      aoa.push([
        person.name || '',
        dominantGroup,
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
              key={`top-link-${index}`}
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
          onClick={openAccountLinkPanel}
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
        <button type="button" className="topnav__settings" onClick={openSettingsPanel}>
          <Icon name="settings" /> <span style={{ marginLeft: 8 }}>{t('设置')}</span>
        </button>
      </div>

      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">{t('出库人效看板')}</p>
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
              <span>{t('出库总工时')}</span>
              <strong>{attendanceReport ? formatHours(attendanceReport.kpi.totalEwhHoursAll) : '--'}</strong>
              <small>{attendanceReport ? t('ObPunch导出') : t('等待ObPunch数据')}</small>
            </div>
          </div>
          <div className="kpi-row kpi-row--compact">
            <div className="kpi-card kpi-mini picking">
              <h3>{t('拣货人效')}</h3>
              <strong>{pickingMini === null ? '--' : pickingMini.toFixed(1)}</strong>
              <small>{t('件 / 小时')}</small>
            </div>
            <div className="kpi-card kpi-mini sorting">
              <h3>{t('分拨人效')}</h3>
              <strong>{sortingMini === null ? '--' : sortingMini.toFixed(1)}</strong>
              <small>{t('件 / 小时')}</small>
            </div>
            <div className="kpi-card kpi-mini packing-single">
              <h3>{t('单品打包')}</h3>
              <strong>{packingSingleMini === null ? '--' : packingSingleMini.toFixed(1)}</strong>
              <small>{t('件 / 小时')}</small>
            </div>
            <div className="kpi-card kpi-mini packing-multi">
              <h3>{t('多品打包')}</h3>
              <strong>{packingMultiMini === null ? '--' : packingMultiMini.toFixed(1)}</strong>
              <small>{t('件 / 小时')}</small>
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
              <div className="banner-shift-card day">
                <small>{t('白班出库完成件数')}</small>
                <strong>{Number(bannerPackingShiftStats.dayUnits || 0).toLocaleString(locale)}</strong>
                <em>
                  {t('出库UPH')}: {bannerPackingShiftStats.dayUph === null ? '--' : bannerPackingShiftStats.dayUph.toFixed(2)}
                </em>
              </div>
              <div className="banner-shift-card night">
                <small>{t('夜班出库完成件数')}</small>
                <strong>{Number(bannerPackingShiftStats.nightUnits || 0).toLocaleString(locale)}</strong>
                <em>
                  {t('出库UPH')}: {bannerPackingShiftStats.nightUph === null ? '--' : bannerPackingShiftStats.nightUph.toFixed(2)}
                </em>
              </div>
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
                <option value="start">{t('第一枪')}</option>
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
              className="primary"
              onClick={() => setShowReportDialog(true)}
            >
              <Icon name="calendar" /> <span style={{ marginLeft: 8 }}>{t('生成日报')}</span>
            </button>
          </div>
        </div>
          <div className="table">
            <div className="table-row table-head">
              <span>{t('名字')}</span>
              <span>{t('所属组')}</span>
              <span>{t('第一枪')}</span>
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
                const ratio = calcWorkRatioPercent(person.ewhHours, person.attendanceHours)
                const dominantGroup = getDominantGroupLabel(person, t)
                const unitParts = []
                if (detailStageFilter === 'picking') {
                  unitParts.push(`${t('拣货')}:${person.pickingUnits}`)
                } else if (detailStageFilter === 'sorting') {
                  unitParts.push(`${t('分拨')}:${person.sortingUnits}`)
                } else if (detailStageFilter === 'packing') {
                  if (person.packingSingleUnits) unitParts.push(`${t('单品')}:${person.packingSingleUnits}`)
                  if (person.packingMultiUnits) unitParts.push(`${t('多品')}:${person.packingMultiUnits}`)
                } else {
                  if (person.pickingUnits) unitParts.push(`${t('拣货')}:${person.pickingUnits}`)
                  if (person.sortingUnits) unitParts.push(`${t('分拨')}:${person.sortingUnits}`)
                  if (person.packingSingleUnits) unitParts.push(`${t('单品')}:${person.packingSingleUnits}`)
                  if (person.packingMultiUnits) unitParts.push(`${t('多品')}:${person.packingMultiUnits}`)
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
                  effParts.push(`${t('拣货')}:${eff === null ? '--' : eff.toFixed(1)}`)
                } else if (detailStageFilter === 'sorting') {
                  effParts.push(`${t('分拨')}:${eff === null ? '--' : eff.toFixed(1)}`)
                } else if (detailStageFilter === 'packing') {
                  const singleEff =
                    person.packingSingleEwhHours > 0
                      ? person.packingSingleUnits / person.packingSingleEwhHours
                      : null
                  const multiEff =
                    person.packingMultiEwhHours > 0
                      ? person.packingMultiUnits / person.packingMultiEwhHours
                      : null
                  if (person.packingSingleUnits) effParts.push(`${t('单品')}:${singleEff === null ? '--' : singleEff.toFixed(1)}`)
                  if (person.packingMultiUnits) effParts.push(`${t('多品')}:${multiEff === null ? '--' : multiEff.toFixed(1)}`)
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
                    : matchIssue
                      ? t('匹配异常')
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
                const startMap = startTimeMaps.all
                const startKey = person.attendanceName
                  ? normalizeName(person.attendanceName)
                  : person.workKey
                    ? person.workKey
                    : person.sources && person.sources.size
                      ? normalizeWorkKey(Array.from(person.sources)[0])
                      : normalizeName(person.name)
                const startMs = startMap.get(startKey)
                const attendanceStartMs = attendanceStartMap.get(startKey)
                const firstGunMinutes =
                  Number.isFinite(startMs) && Number.isFinite(attendanceStartMs)
                    ? Math.max(0, Math.round((startMs - attendanceStartMs) / 60000))
                    : null
                const startLabel = Number.isFinite(firstGunMinutes) ? `${firstGunMinutes}m` : '--'
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
                      <strong>{toDisplayName(person.name)}</strong>
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
                    <span>{dominantGroup}</span>
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
                            part.startsWith(`${t('拣货')}:`)
                              ? 'picking'
                              : part.startsWith(`${t('分拨')}:`)
                                ? 'sorting'
                                : part.startsWith(`${t('单品')}:`)
                                  ? 'packing-single'
                                  : part.startsWith(`${t('多品')}:`)
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
                            part.startsWith(`${t('拣货')}:`)
                              ? 'picking'
                              : part.startsWith(`${t('分拨')}:`)
                                ? 'sorting'
                                : part.startsWith(`${t('单品')}:`)
                                  ? 'packing-single'
                                  : part.startsWith(`${t('多品')}:`)
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
              <span>--</span>
            </div>
          )}
        </div>
      </section>

      {showReportDialog && (
        <div
          className="settings-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowReportDialog(false)
          }}
        >
          <div className="settings-panel" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <h3>{t('报告中心')}</h3>
              <button type="button" onClick={() => setShowReportDialog(false)}>
                {t('关闭')}
              </button>
            </div>
            <div className="settings-grid">
              <div className="settings-item">
                <label className="match-name">{t('报告类型')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={reportType === 'single' ? 'chip active' : 'chip'}
                  onClick={() => setReportType('single')}
                  disabled={reportLoading}
                >
                  {t('单个员工报告')}
                </button>
                  <button
                  type="button"
                  className={reportType === 'role' ? 'chip active' : 'chip'}
                  onClick={() => setReportType('role')}
                  disabled={reportLoading}
                >
                  {t('整个岗位报告（含时间线）')}
                </button>
                </div>
              </div>
              {reportType === 'single' ? (
                <div className="settings-item">
                  <label className="match-name">{t('选择员工')}</label>
                  <input
                    className="settings-input"
                    list="report-employee-options"
                    type="text"
                    value={reportEmployeeName || ''}
                    onChange={(event) => setReportEmployeeName(event.target.value)}
                    disabled={reportLoading || reportEmployeeOptionsLoading}
                    placeholder={reportEmployeeOptionsLoading ? t('加载中') : t('搜索人员')}
                  />
                  <datalist id="report-employee-options">
                    {reportEmployeeOptions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              ) : null}
            </div>
            {reportLoading ? (
              <div className="report-loading" role="status" aria-live="polite">
                <span className="report-loading__spinner" aria-hidden />
                <span>{t('正在生成日报，请稍候…')}</span>
                <div className="report-loading__bar" aria-hidden>
                  <span />
                </div>
              </div>
            ) : null}
            <div className="settings-footer">
              <span>
                {t('记录数')}: {reportType === 'single' ? reportEmployeeOptions.length : sortedDetailRows.length}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="primary"
                  onClick={() => handleGenerateReport(false)}
                  disabled={reportLoading || reportEmployeeOptionsLoading}
                >
                  {reportLoading ? t('生成中') : t('生成')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportPreview && (
        <div
          className="settings-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowReportPreview(false)
          }}
        >
          <div
            className="settings-panel"
            style={{
              width: 'min(1100px, 96vw)',
              height: 'min(88vh, 960px)',
              display: 'grid',
              gridTemplateRows: 'auto 1fr auto',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-header">
              <h3>{reportPreviewTitle || t('报告中心')}</h3>
              <button type="button" onClick={() => setShowReportPreview(false)}>
                {t('关闭')}
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <iframe
                ref={reportPreviewRef}
                title="report-preview"
                srcDoc={reportPreviewHtml}
                style={{ width: '100%', height: '100%', border: '1px solid rgba(18,19,21,0.12)', borderRadius: 12 }}
              />
            </div>
            <div className="settings-footer">
              <span>{t('报告摘要')}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    const iframeWin = reportPreviewRef.current?.contentWindow
                    if (iframeWin) {
                      iframeWin.focus()
                      iframeWin.print()
                    }
                  }}
                >
                  {t('打印报告')}
                </button>
                <button type="button" className="primary" onClick={() => setShowReportPreview(false)}>
                  {t('确定')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="settings-backdrop">
          <div
            className="settings-panel"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-header">
              <h3>{t('数据入口设置')}</h3>
              <button type="button" onClick={closeSettingsPanel}>
                {t('关闭')}
              </button>
            </div>
            <div className="settings-grid">
              {(settingsDraft.length ? settingsDraft : quickLinks).map((item, index) => (
                <div key={`quick-link-${index}`} className="settings-item">
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
              <button type="button" onClick={closeSettingsPanel}>
                {t('完成')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccountLink && (
        <div
          className="settings-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAccountLinkPanel()
          }}
        >
          <div
            className="settings-panel match-panel"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-header">
              <h3>{t('账号关联（全局）')}</h3>
              <button type="button" onClick={closeAccountLinkPanel}>
                {t('关闭')}
              </button>
            </div>
            <input
              className="settings-input"
              type="text"
              value={accountLinkSearch}
              onChange={(event) => setAccountLinkSearch(event.target.value)}
              placeholder={t('搜索账号')}
            />
            <div className="match-list">
              <datalist id="account-link-opts-global">
                {accountLinkOptionList.map((att) => (
                  <option key={`account-opt-${att}`} value={att} />
                ))}
              </datalist>
              {selectedMatchName && !filteredAccountLinkPanelNames.includes(selectedMatchName) ? (
                <div className="match-empty">{t('请选择考勤账号进行匹配')}</div>
              ) : null}
              {attendanceNames.length === 0 ? (
                <div className="match-empty">{t('暂无考勤数据，无法匹配。')}</div>
              ) : filteredAccountLinkPanelNames.length === 0 ? (
                <div className="match-empty">{t('当前没有需要匹配的姓名。')}</div>
              ) : (
                accountLinkRenderNames.map((name) => {
                  const current = accountLinkDraftMap[name] || ''
                  return (
                    <div key={`al-${name}`} className="match-item">
                      <div className="match-name">{name}</div>
                      <div className="match-select-wrap">
                        <input
                          className="match-select"
                          list="account-link-opts-global"
                          value={current}
                          onChange={(event) => updateAccountLinkDraft(name, event.target.value)}
                          placeholder={t('选择工作账号')}
                        />
                      </div>
                      <button
                        type="button"
                        className="match-clear"
                        onClick={() => updateAccountLinkDraft(name, '')}
                      >
                        {t('取消匹配')}
                      </button>
                    </div>
                  )
                })
              )}
              {accountLinkHiddenCount > 0 ? (
                <div className="match-empty">{`仅显示前 ${accountLinkRenderNames.length} 条，请先搜索以缩小范围（剩余 ${accountLinkHiddenCount} 条）`}</div>
              ) : null}
            </div>
            <div className="settings-footer">
              <span>{t('匹配全局生效')}</span>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(t('确认清空所有手动匹配？'))) return
                  resetAccountLinks()
                  setAccountLinkDraftMap({})
                }}
              >
                {t('清空匹配')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMatch && (
        <div
          className="settings-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowMatch(false)
          }}
        >
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
        <div
          className="settings-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowWhitelist(false)
          }}
        >
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
  const asciiFolded = lowered.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const lettersOnly = asciiFolded.replace(/[^a-z\u4e00-\u9fff]+/g, ' ')
  const noDigits = lettersOnly.replace(/\b\d+\b/g, ' ')
  return noDigits.replace(/\s+/g, ' ').trim()
}

const toDisplayName = (name) => {
  let value = String(name || '').trim()
  if (!value) return value
  // Remove trailing account-like suffixes in parentheses, keep plain employee name.
  while (/\s*\([^)]*\d[^)]*\)\s*$/.test(value)) {
    value = value.replace(/\s*\([^)]*\d[^)]*\)\s*$/, '').trim()
  }
  return value
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

const nameTokens = (name) =>
  normalizeName(name)
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)

const tokenJaccard = (aTokens, bTokens) => {
  if (!aTokens.length || !bTokens.length) return 0
  const a = new Set(aTokens)
  const b = new Set(bTokens)
  let inter = 0
  a.forEach((item) => {
    if (b.has(item)) inter += 1
  })
  const union = a.size + b.size - inter
  return union > 0 ? inter / union : 0
}

const bigrams = (text) => {
  const s = String(text || '').replace(/\s+/g, '')
  if (!s) return []
  if (s.length < 2) return [s]
  const out = []
  for (let i = 0; i < s.length - 1; i += 1) out.push(s.slice(i, i + 2))
  return out
}

const diceSimilarity = (a, b) => {
  const aa = bigrams(a)
  const bb = bigrams(b)
  if (!aa.length || !bb.length) return 0
  const counts = new Map()
  aa.forEach((x) => counts.set(x, (counts.get(x) || 0) + 1))
  let inter = 0
  bb.forEach((x) => {
    const c = counts.get(x) || 0
    if (c > 0) {
      inter += 1
      counts.set(x, c - 1)
    }
  })
  return (2 * inter) / (aa.length + bb.length)
}

const levenshteinDistance = (a, b) => {
  const left = String(a || '')
  const right = String(b || '')
  const m = left.length
  const n = right.length
  if (!m) return n
  if (!n) return m
  const prev = new Array(n + 1)
  const cur = new Array(n + 1)
  for (let j = 0; j <= n; j += 1) prev[j] = j
  for (let i = 1; i <= m; i += 1) {
    cur[0] = i
    for (let j = 1; j <= n; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + cost
      )
    }
    for (let j = 0; j <= n; j += 1) prev[j] = cur[j]
  }
  return prev[n]
}

const levenshteinSimilarity = (a, b) => {
  const left = String(a || '').replace(/\s+/g, '')
  const right = String(b || '').replace(/\s+/g, '')
  if (!left || !right) return 0
  if (left === right) return 1
  const dist = levenshteinDistance(left, right)
  return 1 - dist / Math.max(left.length, right.length)
}

const nameSimilarityScore = (left, right) => {
  const a = normalizeName(left)
  const b = normalizeName(right)
  if (!a || !b) return 0
  if (a === b) return 1
  const aTokens = nameTokens(a)
  const bTokens = nameTokens(b)
  const aSorted = [...aTokens].sort().join(' ')
  const bSorted = [...bTokens].sort().join(' ')
  if (aSorted && aSorted === bSorted) return 0.96
  const jaccard = tokenJaccard(aTokens, bTokens)
  const dice = diceSimilarity(a, b)
  const sortedDice = diceSimilarity(aSorted, bSorted)
  const edit = levenshteinSimilarity(a, b)
  const sortedEdit = levenshteinSimilarity(aSorted, bSorted)
  const prefixBoost =
    (a.startsWith(b) || b.startsWith(a)) && Math.min(a.length, b.length) >= 4 ? 0.08 : 0
  return Math.min(1, Math.max(jaccard, dice, sortedDice, edit, sortedEdit) + prefixBoost)
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
  })

  const workByKey = new Map()
  workData.forEach((_, operator) => {
    const key = normalizeWorkKey(operator)
    if (!key) return
    if (!workByKey.has(key)) workByKey.set(key, [])
    workByKey.get(key).push(operator)
  })

  const attendanceCandidates = Array.from(attendanceNameByKey.entries()).map(([key, display]) => ({
    key,
    display: String(display || key),
  }))

  rows.forEach((row, key) => {
    if (row.sources.size) return
    const operators = workByKey.get(key)
    if (!operators || operators.length === 0) return
    operators.forEach((operator) => attachWork(row, operator))
  })

  // 自动模糊匹配：支持轻微拼写误差（如 Vanessa/Vanesa）
  const fuzzyCandidates = []
  workData.forEach((_, operator) => {
    if (linkedWork.has(operator)) return
    const workName = String(operator || '').trim()
    if (!workName) return
    let best = null
    let second = null
    attendanceCandidates.forEach((cand) => {
      const score = nameSimilarityScore(workName, cand.display)
      if (!best || score > best.score) {
        second = best
        best = { key: cand.key, name: cand.display, score }
      } else if (!second || score > second.score) {
        second = { key: cand.key, name: cand.display, score }
      }
    })
    if (
      best &&
      (
        best.score >= 0.9 ||
        (best.score >= 0.82 && (!second || best.score - second.score >= 0.03))
      )
    ) {
      fuzzyCandidates.push({ operator, best })
    }
  })

  fuzzyCandidates.sort((a, b) => b.best.score - a.best.score)
  const fuzzyMapByOperator = new Map()
  const usedAttendanceKeys = new Set()
  fuzzyCandidates.forEach((item) => {
    if (usedAttendanceKeys.has(item.best.key)) return
    fuzzyMapByOperator.set(item.operator, item.best)
    usedAttendanceKeys.add(item.best.key)
  })

  workData.forEach((_, operator) => {
    if (linkedWork.has(operator)) return
    const manualMappedName = reverseNameMap.get(normalizeWorkKey(operator))
    const fuzzyMapped = fuzzyMapByOperator.get(operator)
    const mappedName = manualMappedName || fuzzyMapped?.name || ''
    const baseKey = mappedName ? normalizeName(mappedName) : normalizeWorkKey(operator)
    if (!baseKey) return
    const baseName =
      mappedName || attendanceNameByKey.get(baseKey) || String(operator || '').trim()
    const row = ensureRow(baseKey, baseName)
    if (mappedName && !row.attendanceName) row.attendanceName = mappedName
    attachWork(row, operator)
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
    // 当考勤工时过小（<0.5h）时不计算，避免异常放大
    const attendanceHours = Number(row.attendanceHours || 0)
    if (isAttendanceHoursReliable(attendanceHours)) {
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
