<template>
  <view class="page home">
    <view class="hero">
      <text class="eyebrow">体育课现场记录</text>
      <text class="hero-title">{{ currentClass ? currentClass.name : '请选择课程班级' }}</text>
      <text class="hero-sub">{{ currentClass ? `${currentClass.semester_name} · ${currentClass.student_count || 0} 人` : '适合操场现场单手操作' }}</text>
    </view>

    <view class="entry-grid">
      <button v-for="item in entries" :key="item.url" class="entry" @tap="go(item.url)">
        <text class="entry-icon">{{ item.icon }}</text>
        <text>{{ item.label }}</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';
import { getActiveClassId } from '../../utils/state';

const currentClass = ref(null);
const entries = [
  { label: '课程班级', icon: '班', url: '/pages/classes/classes' },
  { label: '学生名单', icon: '名', url: '/pages/students/students' },
  { label: '课堂考勤', icon: '勤', url: '/pages/attendance/attendance' },
  { label: '考试记录', icon: '考', url: '/pages/exam/exam' },
  { label: '数据导出', icon: '表', url: '/pages/export/export' },
];

function go(url) {
  uni.navigateTo({ url });
}

onShow(async () => {
  const id = getActiveClassId();
  if (!id) {
    currentClass.value = null;
    return;
  }
  try {
    currentClass.value = await request(`/api/classes/${id}`);
  } catch {
    currentClass.value = null;
  }
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.hero {
  min-height: 300rpx;
  padding: 42rpx 34rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14rpx;
  border-radius: 16rpx;
  color: #fff;
  background: linear-gradient(150deg, #1f4d46, #256b7b);
}

.eyebrow {
  color: rgba(255, 255, 255, .75);
  font-size: 26rpx;
}

.hero-title {
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1.15;
}

.hero-sub {
  color: rgba(255, 255, 255, .82);
  font-size: 28rpx;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.entry {
  min-height: 180rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e0e5ec;
  color: #17202f;
  background: #fff;
  font-size: 32rpx;
  font-weight: 800;
}

.entry-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: #1f7a64;
  font-size: 28rpx;
}
</style>
