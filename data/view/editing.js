// 初始化只保留主界面
document.addEventListener('DOMContentLoaded', () => {
  showLoading(true);
  fetchEquipment();
});

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// 错误处理
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'global-error';
  errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
      `;
  document.body.prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

async function fetchEquipment() {
  try {
    const response = await fetch('http://localhost:1000/api/inventory');
    if (!response.ok) throw new Error('获取数据失败');
    const data = await response.json();
    renderEquipment(data);
  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}
function renderEquipment(list) {
  const tbody = document.getElementById('equipment-list');
  tbody.innerHTML = list.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.detail || '-'}</td>
      <td><span class="status-badge ${item.status}">${item.status}</span></td>
      <td>${item.lng}, ${item.lat}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="openEditModal('${item.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" onclick="deleteEquipment('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  try {
    const url = currentEditId 
      ? `http://localhost:1000/api/inventory/${currentEditId}`
      : 'http://localhost:1000/api/inventory';
    data.method = 'edit'//手动加方法
    const body = JSON.stringify(data);
    const response = await fetch(url, {
      method: currentEditId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    if (!response.ok) throw new Error('保存失败');
    closeEditModal();
    await fetchEquipment();
  } catch (error) {
    showError(error.message);
  }
}

async function deleteEquipment(id) {
  if (!confirm('确定要删除该装备吗？')) return;
  
  try {
    const response = await fetch(`http://localhost:1000/api/inventory/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('删除失败');
    await fetchEquipment();
  } catch (error) {
    showError(error.message);
  }
}

async function openEditModal(id) {
  currentEditId = id || null;
  const modal = document.getElementById('edit-modal');
  modal.classList.add('show');
  
  try {
    const form = document.getElementById('equipment-form');

    if (id) {
      // 显示加载状态
      form.querySelectorAll('input, select, textarea').forEach(el => {
        el.disabled = true;
      });
      
      const response = await fetch(`http://localhost:1000/api/inventory/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取设备信息失败');
      }
      const item = await response.json();
      
      // 填充表单
      form.name.value = item.name;
      form.detail.value = item.detail || '';
      form.status.value = item.status;
      form.lng.value = item.lng;
      form.lat.value = item.lat;

      // 启用表单元素
      form.querySelectorAll('input, select, textarea').forEach(el => {
        el.disabled = false;
      });
    } else {
      // 新增模式时重置表单
      form.reset();
    }
  } catch (error) {
    showError(error.message);
    closeEditModal();
  }
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('show');
  document.getElementById('equipment-form').reset();
  currentEditId = null;
}

// 添加状态徽章样式
const statusStyle = `
  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85em;
  }
  .status-badge.库存 { background: #7B7B7B; color: white; }
  .status-badge.使用中 { background: #FFD326; color: white; }
  .status-badge.损坏 { background: #CB2B3E; color: white; }
  .status-badge.空闲 { background: #2AAD27; color: white; }
  .status-badge.失去联系 { background: #3D3D3D; color: white; }
  .status-badge.移动中 { background: #9C2BCB; color: white; }
  .status-badge.维护中 { background: #2A81CB; color: white; }
`;
document.head.insertAdjacentHTML('beforeend', `<style>${statusStyle}</style>`);