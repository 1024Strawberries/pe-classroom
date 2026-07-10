# 体育课现场记录小程序 MVP

本项目已重构为简化版：后端保留 FastAPI + SQLite，前端改为 UniApp Vue 3 微信小程序。旧 `frontend/` React/Vite 前端不再使用。

## 功能结构

- 课程班级：创建学期、创建课程班级、选择当前班级、重命名、删除、查看学生人数
- 学生名单：Excel 导入、按顺序查看、手动新增、修改、删除
- 课堂考勤：按当天日期和课程班级生成唯一场次，逐个学生刷卡式登记正常/迟到/旷课/早退
- 考试记录：创建或选择项目，支持计时类、计数类、距离类，记录定量成绩、技能等级和缺考
- 数据导出：按课程班级导出 Excel，包含考勤、考试成绩、单位和技能等级

## 项目结构

```text
PE/
  backend/
    app/
      main.py
      database.py
      migrations.py
      models.py
      schemas.py
      routers/
        attendance.py
        courses.py
        exports.py
        projects.py
        students.py
    requirements.txt
  miniprogram/
    package.json
    vite.config.js
    src/
      manifest.json
      pages.json
      config/api.js
      utils/request.js
      utils/state.js
      pages/
        index/
        classes/
        students/
        attendance/
        exam/
        export/
```

## 安装依赖

```bash
cd /Users/lfr/Desktop/PE/backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt

cd /Users/lfr/Desktop/PE/miniprogram
npm install
```

## 启动后端

```bash
cd /Users/lfr/Desktop/PE/backend
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

API 文档：

```text
http://127.0.0.1:8000/docs
```

## 启动小程序

开发构建：

```bash
cd /Users/lfr/Desktop/PE/miniprogram
npm run dev:mp-weixin
```

生产构建：

```bash
cd /Users/lfr/Desktop/PE/miniprogram
npm run build:mp-weixin
```

微信开发者工具导入目录：

```text
/Users/lfr/Desktop/PE/miniprogram/dist/dev/mp-weixin
```

如果使用生产构建，则导入：

```text
/Users/lfr/Desktop/PE/miniprogram/dist/build/mp-weixin
```

## API 配置

统一配置文件：

```text
/Users/lfr/Desktop/PE/miniprogram/src/config/api.js
```

开发环境默认：

```js
dev: "http://127.0.0.1:8000"
```

正式环境预留：

```js
prod: "https://api.example.com"
```

微信开发者工具本地调试时，需要在详情/本地设置中勾选“不校验合法域名、web-view、TLS 版本以及 HTTPS 证书”。

## 测试流程

1. 课程班级：创建学期，创建课程班级，选为当前班级。
2. 学生名单：导入 Excel，表头为 `学号`、`姓名`、`班级`；也可以手动新增学生。
3. 课堂考勤：选择课程班级，进入当天考勤，逐个点击状态；返回后再次进入应显示已登记状态，且同一天同班级不会重复生成场次。
4. 考试记录：选择课程班级，创建 `计时类` 项目，测试开始、暂停、继续、结束、重置；保存成绩和技能等级后自动进入下一名学生。
5. 数据导出：选择课程班级，点击导出 Excel，表格应包含学生信息、考勤列、考试成绩列、单位列和技能等级列。
