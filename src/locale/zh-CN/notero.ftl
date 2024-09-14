## Menus

notero-collection-menu-sync = 
    .label = 同步条目至 Notion
notero-item-menu-sync = 
    .label = 同步到 Notion
notero-tools-menu-preferences = 
    .label = Notero 首选项…

## Notion preferences

notero-preferences-notion-groupbox-heading = Notion 首选项
notero-preferences-notion-groupbox-description = 有关获取这些值的说明，请查看 <label data-l10n-name="notero-preferences-readme">README</label>.
notero-preferences-notion-token = 内部集成令牌:
notero-preferences-notion-token-visibility = 
    .tooltiptext =
        { $action ->
            [conceal] 隐藏标记
           *[reveal] 显示标记
        }
notero-preferences-notion-database = 数据库:

## Property preferences

notero-preferences-properties-groupbox-heading = 属性偏好
notero-preferences-properties-groupbox-description = 自定义项目属性如何同步到 Notion。
notero-preferences-page-title-format = 概念页面标题:

## Page title format options

notero-page-title-format-item-author-date-citation = 
    .label = 项目作者-日期引文
notero-page-title-format-item-citation-key = 
    .label = 项目引文密钥 (需要 Better BibTeX)
notero-page-title-format-item-full-citation = 
    .label = 项目完整引用
notero-page-title-format-item-in-text-citation = 
    .label = 项目文本引用
notero-page-title-format-item-short-title = 
    .label = 项目短标题
notero-page-title-format-item-title = 
    .label = 项目标题

## Sync preferences

notero-preferences-sync-groupbox-heading = 同步首选项
notero-preferences-sync-groupbox-description1 = Notero 将监控下面启用的集合。将条目添加到该启用的集合中以及当条目被修改时，都将同步到 Notion。
notero-preferences-sync-groupbox-description2 = 要启用/禁用集合，请选择该行并按 { "[Enter]" } 键或双击该行。要选择多行，请按住 { "[Shift]" } 然后单击。
notero-preferences-collection-column = 集合
notero-preferences-sync-enabled-column = 启用同步
notero-preferences-sync-on-modify-items = 
    .label = 当修改条目时同步
notero-preferences-sync-notes = 
    .label = 同步笔记

## Progress window

notero-progress-headline = 将项目同步到 Notion…
notero-progress-item = 项目 { $step } / { $total }

## Errors

notero-error-missing-notion-database = 未选择 Notion 数据库。请在 Notero 偏好设置中选择您的数据库。
notero-error-missing-notion-token = 未提供 Notion 集成令牌。请在 Notero 偏好设置中输入您的令牌。
notero-error-missing-pref = { $pref } 缺少值。请在 Notero 偏好设置中输入该值。
notero-error-no-notion-databases = 没有可访问的 Notion 数据库。
notero-error-note-conversion-failed = 无法将笔记内容转换为 Notion 块。
notero-error-note-parent-not-synced = 无法同步未同步的项目的注释。
notero-error-note-sync-failed = 无法将笔记同步到 Notion。
notero-error-notion-link-attachment = 无法创建 Notion 链接附件。这将导致重复的 Notion 页面。请确保在 www.notion.so/my-integrations 上为 Notero 集成启用了“读取内容”功能。
