<template>
  <view class="page stack">
    <view class="panel stack">
      <text class="title">学生名单</text>
      <picker :range="classes" range-key="name" @change="pickClass">
        <view class="input picker-text">{{ activeClass ? `${activeClass.name} · ${students.length} 人` : '选择课程班级' }}</view>
      </picker>
      <button class="btn primary" :disabled="!activeClass" @tap="chooseExcel">导入 Excel 名单</button>
      <text class="muted">Excel 第一行字段：学号、姓名、班级。</text>
    </view>

    <view class="panel stack">
      <text class="title">手动新增</text>
      <input class="input" v-model="form.student_no" placeholder="学号" />
      <input class="input" v-model="form.name" placeholder="姓名" />
      <input class="input" v-model="form.class_name" placeholder="班级" />
      <button class="btn primary" :disabled="!activeClass" @tap="saveStudent">{{ editingId ? '保存修改' : '新增学生' }}</button>
      <button v-if="editingId" class="btn" @tap="resetForm">取消修改</button>
    </view>

    <view class="panel stack">
      <text class="title">名单顺序</text>
      <view v-for="(item, idx) in students" :key="item.id" class="student-row">
        <view class="student-info">
          <text class="order">{{ idx + 1 }}</text>
          <view>
            <text class="name">{{ item.name }}</text>
            <text class="muted">{{ item.student_no }} · {{ item.class_name || '未填写班级' }}</text>
          </view>
        </view>
        <view class="row">
          <button class="btn" @tap="editStudent(item)">修改</button>
          <button class="btn danger" @tap="deleteStudent(item)">删除</button>
        </view>
      </view>
      <text v-if="!students.length" class="muted">暂无学生</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request, uploadFile } from '../../utils/request';
import { getActiveClassId, setActiveClassId } from '../../utils/state';

const classes = ref([]);
const activeClassId = ref(getActiveClassId());
const students = ref([]);
const editingId = ref(0);
const form = ref({ student_no: '', name: '', class_name: '' });

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

function pickClass(e) {
  activeClassId.value = classes.value[Number(e.detail.value)]?.id || 0;
  setActiveClassId(activeClassId.value);
  loadStudents();
}

function chooseExcel() {
  if (!activeClass.value) return;
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['xlsx', 'xls'],
    success: async (res) => {
      const filePath = res.tempFiles?.[0]?.path;
      if (!filePath) return;
      const data = await uploadFile(`/api/classes/${activeClassId.value}/students/import`, filePath);
      await loadStudents();
      uni.showToast({ title: `已导入 ${data.imported} 人`, icon: 'none' });
    },
  });
  // #endif
}

async function saveStudent() {
  if (!activeClass.value) return;
  if (!form.value.student_no.trim() || !form.value.name.trim()) {
    uni.showToast({ title: '请填写学号和姓名', icon: 'none' });
    return;
  }
  const path = editingId.value
    ? `/api/classes/${activeClassId.value}/students/${editingId.value}`
    : `/api/classes/${activeClassId.value}/students`;
  await request(path, {
    method: editingId.value ? 'PUT' : 'POST',
    data: form.value,
  });
  resetForm();
  await loadStudents();
  uni.showToast({ title: '已保存', icon: 'none' });
}

function editStudent(item) {
  editingId.value = item.id;
  form.value = { student_no: item.student_no, name: item.name, class_name: item.class_name };
}

function resetForm() {
  editingId.value = 0;
  form.value = { student_no: '', name: '', class_name: '' };
}

function deleteStudent(item) {
  uni.showModal({
    title: '删除学生',
    content: `确认删除 ${item.name}？`,
    success: async (res) => {
      if (!res.confirm) return;
      await request(`/api/classes/${activeClassId.value}/students/${item.id}`, { method: 'DELETE' });
      await loadStudents();
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
}

.student-row {
  padding: 22rpx 0;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  border-bottom: 1rpx solid #edf0f4;
}

.student-row:last-child {
  border-bottom: 0;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.order {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: #1f7a64;
  font-weight: 800;
}

.name {
  display: block;
  margin-bottom: 6rpx;
  color: #17202f;
  font-size: 32rpx;
  font-weight: 800;
}
</style>
