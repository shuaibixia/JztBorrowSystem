---
name: 摄影器材管理
description: 面向学生组织的摄影器材借还、预约与审批小程序。
colors:
  primary: "#245F92"
  primary-hover: "#1E527F"
  primary-active: "#184468"
  canvas: "#F7F8FA"
  surface: "#FFFFFF"
  surface-subtle: "#F2F4F7"
  text-primary: "#1D1D1F"
  text-secondary: "#424245"
  text-muted: "#6E6E73"
  text-meta: "#86868B"
  line: "#CFD5DD"
  line-soft: "#E6E9EE"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  control: "8px"
  surface: "12px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
  field-default:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
  surface-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
---

# Design System: 摄影器材管理

## Overview

**Creative North Star: "安静的器材工作台"**

这是一个高频、任务导向的微信小程序。视觉应像学生组织里可靠的器材台账：冷灰画布、白色内容面、克制的蓝色操作，不把借还、审批和预约包装成营销页面。信息密度可以高，但必须先让用户看到当前状态和下一步动作。

OpenDesign 的移动端屏幕是布局与信息层级的骨架。实现时保留真实数据、权限、空态、错误态和小程序安全区；网页端的渐变文字、玻璃模糊、红色标注和桌面画布不进入正式产品。首页快捷区已被明确批准为一主两次的非等权结构，以突出扫码借还。

**Key Characteristics:**
- 系统字体、紧凑而稳定的五级文字层级。
- 一页一个主操作，蓝色只用于主操作、当前选择与信息状态。
- 内容使用留白、分隔和状态色建立层级，不用重复悬浮卡片堆砌。
- 标准控件优先使用 TDesign；页面构图可用原生 WXML/WXSS 精确适配移动端。

## Colors

冷灰中性面承载信息，低饱和的钢蓝 `#245F92` 是唯一常规强调色；绿色、橙色、红色只表达成功、提醒和风险，绝不作为装饰色。

### Primary
- **Quiet Equipment Blue** (`#245F92`): 主按钮、当前 tab、可点击文字和非危险的信息状态。
- **Blue Pressed** (`#184468`): 仅用于按压或激活反馈。

### Neutral
- **Cool Canvas** (`#F7F8FA`): 页面背景。
- **Clean Surface** (`#FFFFFF`): 列表分组、表单和需要承载层级的内容面。
- **Quiet Surface** (`#F2F4F7`): 搜索、输入与低优先级承载面。
- **Primary Ink** (`#1D1D1F`): 标题、数据和关键文字。
- **Muted Ink** (`#6E6E73`): 说明、日期和次级信息。
- **Fine Divider** (`#E6E9EE`): 分组边界与列表分隔。

### Semantic
- **Success** (`#16A34A`): 已完成、可用等正向业务状态。
- **Warning** (`#D97706`): 临期、待处理等提醒状态。
- **Danger** (`#DC2626`): 逾期、失败、取消和危险操作。

**The One Blue Rule.** 同一页面只让蓝色承担一个明确的主意图；状态色从不与它争夺主按钮的视觉权重。

## Typography

**Display Font:** 系统字体栈（`-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Segoe UI, sans-serif`）

**Body Font:** 与 Display 相同。原生小程序不加载网络中文字体，以保证启动速度和中文字形稳定。

**Character:** 清晰、紧凑、可扫描。标题通过字号和字重建立层级，不使用展示字体、斜体装饰或负字距。

### Hierarchy
- **Display** (600, 24px, 1.25): 页面主标题、首页姓名。
- **Headline** (600, 18px, 1.35): 区块标题和重要条目标题。
- **Body** (400/500, 15px, 1.5): 正文、按钮和常规设备信息。
- **Label** (400/500, 14px, 1.45): 标签、表单标题和辅助操作。
- **Meta** (400, 12px, 1.4): 时间、编号、说明和低优先级状态。

**The Scanability Rule.** 每一个列表行必须先暴露名称或状态；二维码、SN、时间等元数据退后一级并具备长文本省略或安全换行策略。

## Elevation

默认是平面系统：同一内容面只使用细分隔线或一层极轻的环境阴影，二者不可叠加。列表分组优先用白色表面和内部 `1px` 分隔；固定底栏和 tabBar 用顶部分隔线，而不是宽阴影。只有 FAB、弹层等真正浮起的临时层级才可使用短、低模糊的阴影。

**The No Ghost Card Rule.** 禁止同时使用 `1px` 边框和宽阴影制造“漂浮卡片”。不需要层级的内容直接放在画布上，用留白或分隔线组织。

## Components

### Buttons
- **Shape:** 标准按钮和输入框为 8px；内容面为 12px；标签可以全圆角。
- **Primary:** `#245F92` 底、白字、至少 44px 触控高度；文本始终单行且对比度达标。首页快捷操作不是默认的整块品牌色按钮，而是白色分组中的主行，使用钢蓝图标、文字或细边界表达优先级。
- **Pressed:** 150-200ms 内仅使用轻微 opacity 或 `scale(0.98)` 反馈，不做页面入场动画。
- **Secondary:** 白色或弱背景、清晰文字和必要分隔，不与主操作使用同等蓝色填充。

### Surfaces And Lists
- **Content surface:** 12px 圆角、白色背景；选择细边框或轻阴影之一。
- **List:** 多行数据优先放进一个分组表面，行内用分隔线，而非每行一张悬浮卡。
- **Stats:** 同类统计使用一个有内部分隔的整体，避免无意义的等权指标卡矩阵。

### Inputs / Fields
- **Style:** 标签在输入内容之前；弱背景或细边框，8px 圆角。
- **Validation:** 校验和错误信息紧邻字段或提交操作；toast 仅用于瞬时反馈。
- **States:** loading、empty、error、success、disabled 和 submitting 必须可读且不可误触。

### Navigation
- **Top bar:** 原生安全区、单行标题、仅保留必要的通知或返回操作。
- **Bottom tabBar:** 平面白色底、细顶部边界、四项等宽；选中态通过蓝色图标与文字表达，不使用胶囊、浮动岛或标签式背景。

## Do's and Don'ts

### Do:
- **Do** 以 OpenDesign 的屏幕结构为基线，先还原首屏几何、留白和信息顺序，再微调颜色。
- **Do** 使用 4px 间距体系，常规横向边距为 16px，主触控区至少为 44px。
- **Do** 保留 TDesign 的按钮、tabs、弹层、空态、loading 和标准表单行为。
- **Do** 为长设备名、二维码、SN、用途和拒绝原因提供省略或安全换行。
- **Do** 把一个页面最重要的操作做成唯一最显眼的强调动作，可通过位置、尺寸和字重建立优先级，不必每次都铺满品牌色。

### Don't:
- **Don't** 用大量等权图标卡片、圆形图标套娃或每个区块重复大标题制造模板感。
- **Don't** 默认把首页或工具页的主操作做成高饱和整块蓝底；品牌色应先服务于状态和路径，而不是抢走内容层级。
- **Don't** 同时给内容面加细边框和宽阴影，也不要把每行列表都做成独立浮卡。
- **Don't** 使用渐变文字、紫色/蓝紫色光晕、玻璃模糊、装饰性网格、浮动胶囊 tabBar 或无意义的装饰色。
- **Don't** 为了参考截图伪造统计、设备或操作状态；真实业务数据与权限优先。
- **Don't** 让危险操作、网络失败或提交中状态只依赖瞬时 toast。
