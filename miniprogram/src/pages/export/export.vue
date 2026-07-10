<template>
  <view class="page stack">
    <view class="panel stack">
      <text class="title">数据导出</text>
      <picker :range="classes" range-key="name" @change="pickClass">
        <view class="input picker-text">{{ activeClass ? activeClass.name : '选择课程班级' }}</view>
      </picker>
      <text class="muted">{{ activeClass ? `${activeClass.semester_name} · ${students.length} 人` : '请选择需要导出的课程班级' }}</text>
      <button class="btn primary" :disabled="!activeClass" @tap="exportExcel">导出 Excel</button>
    </view>

    <view class="panel stack">
      <text class="title">导出内容</text>
      <text class="muted">每个学生一行，包含学号、姓名、班级、每次考勤状态、每个考试项目的定量成绩、单位和技能等级。</text>
      <view v-for="item in students" :key="item.id" class="student-row">
        <text>{{ item.student_no }}</text>
        <text>{{ item.name }}</text>
        <text>{{ item.class_name }}</text>
      </view>
      <text v-if="!students.length" class="muted">暂无学生</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { downloadFile, request } from '../../utils/request';
import { getActiveClassId, setActiveClassId } from '../../utils/state';

const classes = ref([]);
const students = ref([]);
const activeClassId = ref(getActiveClassId());
const activeClass = computed(() => classes.value.find(item => item.id === activeClassId.value));

async function loadClasses() {
  classes.value = await request('/api/classes');
  if (!activeClassId.value && classes.value[0]) {
    activeClassId.value = classes.value[0].id;
    setActiveClassId(activeClassId.value);
  }
}

async function loadStudents() {
  if (!activeClassId.value) {
    students.value = [];
    return;
  }
  students.value = await request(`/api/classes/${activeClassId.value}/students`);
}

async function load() {
  await loadClasses();
  await loadStudents();
}

async function pickClass(e) {
  activeClassId.value = classes.value[Number(e.detail.value)]?.id || 0;
  setActiveClassId(activeClassId.value);
  await loadStudents();
}

async function exportExcel() {
  if (!activeClass.value) return;
  const filePath = await downloadFile(`/api/classes/${activeClassId.value}/export.xlsx`);
  uni.openDocument({
    filePath,
    fileType: 'xlsx',
    showMenu: true,
    fail() {
      uni.showToast({ title: '已下载，但无法打开文件', icon: 'none' });
    },
  });
}

onShow(load);
</script>

<style scoped>
.picker-text {
  display: flex;
  align-items: center;
}

.student-row {
  min-height: 72rpx;
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.4fr;
  align-items: center;
  gap: 12rpx;
  border-bottom: 1rpx solid #edf0f4;
  color: #17202f;
  font-size: 28rpx;
}

.student-row:last-child {
  border-bottom: 0;
}
</style>
