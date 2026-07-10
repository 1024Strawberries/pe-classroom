<template>
  <view class="page stack">
    <view class="panel stack">
      <text class="title">课堂考勤</text>
      <picker :range="classes" range-key="name" @change="pickClass">
        <view class="input picker-text">{{ activeClass ? activeClass.name : '选择课程班级' }}</view>
      </picker>
      <view class="meta-row">
        <text>{{ date }}</text>
        <text>{{ students.length ? `${index + 1}/${students.length}` : '0/0' }}</text>
      </view>
    </view>

    <view class="card">
      <text class="student-no">{{ currentStudent?.student_no || '暂无学生' }}</text>
      <text class="student-name">{{ currentStudent?.name || '请导入名单' }}</text>
      <text class="student-class">{{ currentStudent?.class_name || '' }}</text>
      <text class="status-pill">{{ currentStatus || '未登记' }}</text>
    </view>

    <view class="status-grid">
      <button v-for="status in statuses" :key="status" class="btn status-btn" @tap="saveStatus(status)">{{ status }}</button>
    </view>

    <view class="row">
      <button class="btn" :disabled="index <= 0" @tap="index--">上一个</button>
      <button class="btn" :disabled="index >= students.length - 1" @tap="index++">下一个</button>
    </view>

    <view class="panel stack">
      <text class="title">本次考勤汇总</text>
      <view class="summary-grid">
        <view v-for="status in statuses" :key="status" class="summary-item">
          <text>{{ status }}</text>
          <text>{{ countStatus(status) }}</text>
        </view>
      </view>
      <text class="muted">已登记 {{ Object.keys(records).length }} / {{ students.length }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { getActiveClassId, setActiveClassId, today } from '../../utils/state';

const statuses = ['正常', '迟到', '旷课', '早退'];
const classes = ref([]);
const activeClassId = ref(getActiveClassId());
const students = ref([]);
const index = ref(0);
const date = ref(today());
const session = ref(null);
const records = ref({});

const activeClass = computed(() => classes.value.find(item => item.id === activeClassId.value));
const currentStudent = computed(() => students.value[index.value]);
const currentStatus = computed(() => currentStudent.value ? records.value[currentStudent.value.id] : '');

async function loadClasses() {
  classes.value = await request('/api/classes');
  if (!activeClassId.value && classes.value[0]) {
    activeClassId.value = classes.value[0].id;
    setActiveClassId(activeClassId.value);
  }
}

async function loadSession() {
  if (!activeClassId.value) return;
  students.value = await request(`/api/classes/${activeClassId.value}/students`);
  session.value = await request(`/api/classes/${activeClassId.value}/attendance-sessions/by-date/${date.value}`);
  const rows = await request(`/api/classes/${activeClassId.value}/attendance-sessions/${session.value.id}/records`);
  records.value = Object.fromEntries(rows.map(row => [row.student_id, row.status]));
  index.value = Math.min(index.value, Math.max(students.value.length - 1, 0));
}

async function load() {
  await loadClasses();
  await loadSession();
}

async function pickClass(e) {
  activeClassId.value = classes.value[Number(e.detail.value)]?.id || 0;
  setActiveClassId(activeClassId.value);
  index.value = 0;
  records.value = {};
  await loadSession();
}

async function saveStatus(status) {
  if (!currentStudent.value || !session.value) return;
  const studentId = currentStudent.value.id;
  await request(`/api/classes/${activeClassId.value}/attendance-sessions/${session.value.id}/records`, {
    method: 'POST',
    data: { student_id: studentId, status },
  });
  records.value = { ...records.value, [studentId]: status };
  if (index.value < students.value.length - 1) index.value += 1;
}

function countStatus(status) {
  return Object.values(records.value).filter(item => item === status).length;
}

onShow(load);
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
  font-size: 30rpx;
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

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.status-btn {
  min-height: 132rpx;
  font-size: 40rpx;
  font-weight: 900;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.summary-item {
  min-height: 96rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 10rpx;
  background: #f3f6f9;
  font-weight: 800;
}
</style>
