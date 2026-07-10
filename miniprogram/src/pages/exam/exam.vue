<template>
  <view class="page stack">
    <view class="panel stack">
      <text class="title">考试记录</text>
      <picker :range="classes" range-key="name" @change="pickClass">
        <view class="input picker-text">{{ activeClass ? activeClass.name : '选择课程班级' }}</view>
      </picker>
    </view>

    <view class="panel stack">
      <text class="title">创建考试项目</text>
      <input class="input" v-model="projectForm.name" placeholder="项目名称，例如 50米" />
      <picker :range="projectTypes" @change="pickProjectType">
        <view class="input picker-text">{{ projectForm.project_type }}</view>
      </picker>
      <input class="input" v-model="projectForm.unit" placeholder="单位，例如 秒、次、米" />
      <button class="btn primary" :disabled="!activeClass" @tap="createProject">创建项目</button>
    </view>

    <view class="panel stack">
      <text class="title">选择项目</text>
      <picker :range="projects" range-key="name" @change="pickProject">
        <view class="input picker-text">{{ currentProject ? `${currentProject.name} · ${currentProject.project_type}` : '选择考试项目' }}</view>
      </picker>
      <view class="meta-row">
        <text>{{ students.length ? `${index + 1}/${students.length}` : '0/0' }}</text>
        <text>完成 {{ completedCount }}/{{ students.length }}</text>
      </view>
    </view>

    <view class="card">
      <text class="student-no">{{ currentStudent?.student_no || '暂无学生' }}</text>
      <text class="student-name">{{ currentStudent?.name || '请导入名单' }}</text>
      <text class="student-class">{{ currentStudent?.class_name || '' }}</text>
      <text class="status-pill">{{ savedText }}</text>
    </view>

    <view v-if="currentProject" class="panel stack">
      <template v-if="currentProject.project_type === '计时类'">
        <view class="timer">{{ timerText }}</view>
        <view class="timer-actions">
          <button class="btn" @tap="startTimer">{{ elapsed ? '继续' : '开始' }}</button>
          <button class="btn" @tap="pauseTimer">暂停</button>
          <button class="btn" @tap="finishTimer">结束</button>
          <button class="btn" @tap="resetTimer">重置</button>
        </view>
      </template>

      <view class="field">
        <text class="label">{{ valueLabel }}</text>
        <view v-if="currentProject.project_type === '计数类'" class="row">
          <button class="btn" @tap="changeCount(-1)">减一</button>
          <input class="input" type="number" v-model="value" />
          <button class="btn" @tap="changeCount(1)">加一</button>
        </view>
        <input v-else class="input" type="digit" v-model="value" :placeholder="currentProject.unit" />
      </view>

      <view class="skill-grid">
        <button v-for="item in skills" :key="item" class="btn skill-btn" :class="{ active: skill === item }" @tap="skill = item">{{ item }}</button>
      </view>

      <button class="btn" :class="{ danger: absent }" @tap="toggleAbsent">{{ absent ? '已标记缺考' : '标记缺考' }}</button>
      <button class="btn primary" :disabled="!currentStudent" @tap="saveResult">保存并下一个</button>
    </view>

    <view class="row">
      <button class="btn" :disabled="index <= 0" @tap="index--">上一个</button>
      <button class="btn" :disabled="index >= students.length - 1" @tap="index++">下一个</button>
    </view>
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { getActiveClassId, setActiveClassId } from '../../utils/state';

const projectTypes = ['计时类', '计数类', '距离类'];
const skills = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'];
const classes = ref([]);
const activeClassId = ref(getActiveClassId());
const students = ref([]);
const projects = ref([]);
const projectId = ref(0);
const results = ref({});
const index = ref(0);
const value = ref('');
const skill = ref('A');
const absent = ref(false);
const projectForm = ref({ name: '', project_type: '计时类', unit: '' });
const elapsed = ref(0);
const running = ref(false);
let startedAt = 0;
let timerId = 0;

const activeClass = computed(() => classes.value.find(item => item.id === activeClassId.value));
const currentProject = computed(() => projects.value.find(item => item.id === projectId.value));
const currentStudent = computed(() => students.value[index.value]);
const currentResult = computed(() => currentStudent.value ? results.value[currentStudent.value.id] : null);
const completedCount = computed(() => Object.keys(results.value).length);
const savedText = computed(() => currentResult.value ? (currentResult.value.absent ? '缺考' : '已保存') : '未保存');
const valueLabel = computed(() => {
  if (!currentProject.value) return '成绩';
  if (currentProject.value.project_type === '计时类') return `最终时间（${currentProject.value.unit || '秒'}）`;
  if (currentProject.value.project_type === '计数类') return `数量（${currentProject.value.unit || '次'}）`;
  return `距离（${currentProject.value.unit || '米'}）`;
});
const timerText = computed(() => {
  const total = Math.max(0, elapsed.value);
  const minutes = String(Math.floor(total / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((total % 60000) / 1000)).padStart(2, '0');
  const centiseconds = String(Math.floor((total % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}.${centiseconds}`;
});

async function loadClasses() {
  classes.value = await request('/api/classes');
  if (!activeClassId.value && classes.value[0]) {
    activeClassId.value = classes.value[0].id;
    setActiveClassId(activeClassId.value);
  }
}

async function loadForClass() {
  if (!activeClassId.value) return;
  students.value = await request(`/api/classes/${activeClassId.value}/students`);
  projects.value = await request(`/api/classes/${activeClassId.value}/exam-projects`);
  if (!projectId.value && projects.value[0]) projectId.value = projects.value[0].id;
  await loadResults();
}

async function loadResults() {
  if (!activeClassId.value || !projectId.value) {
    results.value = {};
    return;
  }
  const rows = await request(`/api/classes/${activeClassId.value}/exam-projects/${projectId.value}/results`);
  results.value = Object.fromEntries(rows.map(row => [row.student_id, row]));
}

async function load() {
  await loadClasses();
  await loadForClass();
}

async function pickClass(e) {
  activeClassId.value = classes.value[Number(e.detail.value)]?.id || 0;
  setActiveClassId(activeClassId.value);
  projectId.value = 0;
  index.value = 0;
  await loadForClass();
}

function pickProjectType(e) {
  projectForm.value.project_type = projectTypes[Number(e.detail.value)];
}

async function createProject() {
  if (!activeClass.value || !projectForm.value.name.trim()) {
    uni.showToast({ title: '请选择班级并填写项目名称', icon: 'none' });
    return;
  }
  const row = await request(`/api/classes/${activeClassId.value}/exam-projects`, {
    method: 'POST',
    data: projectForm.value,
  });
  projectForm.value = { name: '', project_type: '计时类', unit: '' };
  projectId.value = row.id;
  await loadForClass();
  uni.showToast({ title: '项目已创建', icon: 'none' });
}

async function pickProject(e) {
  projectId.value = projects.value[Number(e.detail.value)]?.id || 0;
  index.value = 0;
  await loadResults();
}

watch([currentStudent, currentResult], () => {
  value.value = currentResult.value?.quantitative_value || '';
  skill.value = currentResult.value?.skill_level || 'A';
  absent.value = Boolean(currentResult.value?.absent);
  resetTimer();
});

function tick() {
  elapsed.value = Date.now() - startedAt;
}

function startTimer() {
  if (running.value) return;
  startedAt = Date.now() - elapsed.value;
  running.value = true;
  timerId = setInterval(tick, 80);
}

function pauseTimer() {
  running.value = false;
  if (timerId) clearInterval(timerId);
}

function finishTimer() {
  if (running.value) tick();
  pauseTimer();
  value.value = (elapsed.value / 1000).toFixed(2);
}

function resetTimer() {
  pauseTimer();
  elapsed.value = 0;
}

function changeCount(delta) {
  const next = Math.max(0, Number(value.value || 0) + delta);
  value.value = String(next);
}

function toggleAbsent() {
  absent.value = !absent.value;
  if (absent.value) value.value = '';
}

async function saveResult() {
  if (!currentProject.value || !currentStudent.value) return;
  const row = await request(`/api/classes/${activeClassId.value}/exam-projects/${currentProject.value.id}/results`, {
    method: 'POST',
    data: {
      student_id: currentStudent.value.id,
      quantitative_value: absent.value ? '' : value.value,
      skill_level: skill.value,
      absent: absent.value ? 1 : 0,
    },
  });
  results.value = { ...results.value, [currentStudent.value.id]: row };
  if (index.value < students.value.length - 1) index.value += 1;
}

onShow(load);
onBeforeUnmount(pauseTimer);
</script>

<style scoped>
.picker-text,
.meta-row {
  display: flex;
  align-items: center;
}

.meta-row {
  justify-content: space-between;
  color: #1f4d46;
  font-size: 28rpx;
  font-weight: 800;
}

.status-pill {
  margin-top: 16rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  color: #1f4d46;
  background: #fff;
  font-size: 26rpx;
  font-weight: 800;
}

.timer {
  text-align: center;
  color: #17202f;
  font-size: 72rpx;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.timer-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.skill-btn.active {
  border-color: #1f7a64;
  color: #fff;
  background: #1f7a64;
}
</style>
