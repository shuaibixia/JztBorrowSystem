# Admin Web Design Contract

## Scene

器材组成员在办公室或活动现场的笔记本电脑上处理多项事务：他们需要快速看清逾期、审批、预约和器材状态，而不是浏览一张宣传页。

## Direction

“安静的运营台账”。冷白画布、极浅灰侧栏、白色工作面和单一 Fluent 蓝色主操作。信息通过对齐、分隔、表格密度和状态色组织；不通过大面积卡片、渐变、玻璃模糊或装饰图形制造层级。

## Tokens

- Font: `Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif`
- Canvas: `#F6F7F9`; sidebar: `#FBFCFD`; surface: `#FFFFFF`
- Ink: `#26323E`; secondary: `#697580`; divider: `#E1E5EA`
- Primary: `#0F6CBD`; success: `#107C41`; warning: `#8A6100`; danger: `#B42318`
- Control radius: `8px`; surface radius: `10px`; no wide decorative shadows
- Spacing grid: `4px`; standard content gap: `20px`; content inset: `20px/22px`

## Layout Rules

- Desktop-first, minimum supported width `1024px`; validate at `1024`, `1280`, `1440`.
- Fixed 248px side navigation with a compact top bar and one scrolling task area.
- Lists use one grouped table surface with row dividers. Use cards only for true summary groups or distinct workflow panels.
- Blue identifies a primary action/current navigation state; semantic colors only identify business status.
- Use Fluent components for buttons, dialogs, inputs, tabs, badges and feedback. Native semantic tables are allowed for dense data.

## States

Each data page must cover skeleton loading, empty state with one next action, retryable error, unauthorized state, submitted/disabled action and optimistic result feedback. Destructive actions use Fluent dialogs.
