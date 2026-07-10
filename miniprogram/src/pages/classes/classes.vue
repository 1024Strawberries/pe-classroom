<template>
  <view class="page stack">
    <view class="panel stack">
      <text class="title">创建学期</text>
      <input class="input" v-model="semesterName" placeholder="例如 2026-2027 第一学期" />
      <button class="btn primary" @tap="createSemester">保存学期</button>
    </view>

    <view class="panel stack">
      <text class="title">创建课程班级</text>
      <picker :range="semesters" range-key="name" @change="pickSemester">
        <view class="input picker-text">{{ selectedSemesterName || '选择学期' }}</view>
      </picker>
      <input class="input" v-model="className" placeholder="例如 2026级篮球1班" />
      <button class="btn primary" @tap="createClass">保存班级</button>
    </view>

    <view class="panel stack">
      <text class="title">当前课程班级</text>
      <view v-if="activeClass" class="active-card">
        <text class="active-name">{{ activeClass.name }}</text>
        <text class="muted">{{ activeClass.semester_name }} · {{ activeClass.student_count || 0 }} 人</text>
      </view>
      <text v-else class="muted">尚未选择课程班级</text>
    </view>

    <view class="panel stack">
      <text class="title">课程班级列表</text>
      <view v-for="item in classes" :key="item.id" class="class-row">
        <view class="class-main" @tap="selectClass(item)">
          <text class="class-name">{{ item.name }}</text>
          <text class="muted">{{ item.semester_name }} · {{ item.student_count || 0 }} 人</text>
        </view>
        <view class="row">
          <button class="btn" @tap="renameClass(item)">改名</button>
          <button class="btn danger" @tap="removeClass(item)">删除</button>
        </view>
      </view>
      <text v-if="!classes.length" class="muted">暂无课程班级</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { getActiveClassId, setActiveClassId } from '../../utils/state';

const semesters = ref([]);
const classes = ref([]);
const semesterName = ref('');
const selectedSemesterId = ref(0);
const className = ref('');
const activeClassId = ref(getActiveClassId());

const activeClass = computed(() => classes.value.find(item => item.id === activeClassId.value));
const selectedSemesterName = computed(() => semesters.value.find(item => item.id === selectedSemesterId.value)?.name || '');

async function load() {
  semesters.value = await request('/api/semesters');
  classes.value = await request('/api/classes');
  if (!activeClassId.value && classes.value[0]) {
    selectClass(classes.value[0], false);
  }
}

function pickSemester(e) {
  selectedSemesterId.value = semesters.value[Number(e.detail.value)]?.id || 0;
}

async function createSemester() {
  if (!semesterName.value.trim()) {
    uni.showToast({ title: '请输入学期名称', icon: 'none' });
    return;
  }
  const row = await request('/api/semesters', { method: 'POST', data: { name: semesterName.value } });
  selectedSemesterId.value = row.id;
  semesterName.value = '';
  await load();
  uni.showToast({ title: '学期已保存', icon: 'none' });
}

async function createClass() {
  if (!selectedSemesterId.value || !className.value.trim()) {
    uni.showToast({ title: '请选择学期并填写班级', icon: 'none' });
    return;
  }
  const row = await request('/api/classes', {
    method: 'POST',
    data: { semester_id: selectedSemesterId.value, name: className.value },
  });
  className.value = '';
  selectClass(row, false);
  await load();
  uni.showToast({ title: '班级已保存', icon: 'none' });
}

function selectClass(item, toast = true) {
  activeClassId.value = item.id;
  setActiveClassId(item.id);
  if (toast) uni.showToast({ title: '已选择当前班级', icon: 'none' });
}

function renameClass(item) {
  uni.showModal({
    title: '修改班级名称',
    editable: true,
    placeholderText: item.name,
    success: async (res) => {
      if (!res.confirm || !res.content?.trim()) return;
      await request(`/api/classes/${item.id}`, { method: 'PUT', data: { name: res.content } });
      await load();
      uni.showToast({ title: '已修改', icon: 'none' });
    },
  });
}

function removeClass(item) {
  uni.showModal({
    title: '删除课程班级',
    content: `确认删除“${item.name}”？相关学生、考勤和成绩会一起删除。`,
    success: async (res) => {
      if (!res.confirm) return;
      await request(`/api/classes/${item.id}`, { method: 'DELETE' });
      if (activeClassId.value === item.id) {
        activeClassId.value = 0;
        setActiveClassId(0);
      }
      await load();
      uni.showToast({ title: '已删除', icon: 'none' });
    },
  });
}

onShow(load);
</script>

<style scoped>
.picker-text {
  display: flex;
  align-items: center;
  color: #17202f;
}

.active-card {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  border-radius: 12rpx;
  background: #f0f7f4;
}

.active-name,
.class-name {
  color: #17202f;
  font-size: 32rpx;
  font-weight: 800;
}

.class-row {
  padding: 20rpx 0;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  border-bottom: 1rpx solid #edf0f4;
}

.class-row:last-child {
  border-bottom: 0;
}

.class-main {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
</style>
