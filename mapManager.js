//mapManager.js
let map;
let equipmentState = {};//结构：[1:{marker:e,data:{id,name,lat,lng,status,detail}}]
const customIcons = {// 自定义图标
  red: L.icon({
    iconUrl: './data/image/marker-icon-2x-red.png',
    shadowUrl: './data/image/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  green: L.icon({
    iconUrl: './data/image/marker-icon-2x-green.png',
    shadowUrl: './data/image/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  blue: L.icon({
    iconUrl: './data/image/marker-icon-2x-blue.png',
    shadowUrl: './data/image/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  gold: L.icon({
    iconUrl: './data/image/marker-icon-2x-gold.png',
    shadowUrl: './data/image/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  black: L.icon({
    iconUrl: './data/image/marker-icon-2x-black.png',
    shadowUrl: './data/image/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  grey: L.icon({
    iconUrl: './data/image/marker-icon-2x-grey.png',
    shadowUrl: './data/image/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  violet: L.icon({
    iconUrl: './data/image/marker-icon-2x-violet.png',
    shadowUrl: './data/image/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
};

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
// 提示窗口
function showInfo(message) {
  const infoDiv = document.createElement('div');
  infoDiv.className = 'global-info';
  infoDiv.innerHTML = `
        <i class="fas fa-circle-info"></i>
        ${message}
      `;
  document.body.prepend(infoDiv);
  setTimeout(() => infoDiv.remove(), 5000);
}

var baseLayer = (
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'))

// 仅在主页初始化地图
function initMap() {
  const map = L.map('map', {
    center: [39.9042, 116.4074],
    zoom: 13,
    layers: [baseLayer]
  });
  return map;
}

// 初始化装备及地图
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    map = initMap();
    fetch('http://localhost:1000/api/inventory')
      .then(response => response.json())
      .then(equipments => {
        console.log('获取装备信息成功：', equipments);
        equipments.forEach(equipment => {
          equipmentState[equipment.id] = { marker: 666, data: equipment };
          markerUpdater(equipment, 'init');
        });
      })
      .catch(error => showError(error));
  }
});

//地图标记
function markerUpdater(equipment, mode) {
  if (mode === 'init' || mode === 'drag') {
    let newmarker;
    if (mode === 'init') {
      switch (equipment.status) {
        case '空闲':
          newmarker = L.marker([equipment.lat, equipment.lng], { icon: customIcons.green });
          break;
        case '使用中':
          newmarker = L.marker([equipment.lat, equipment.lng], { icon: customIcons.gold });
          break;
        case '维护中':
          newmarker = L.marker([equipment.lat, equipment.lng], { icon: customIcons.blue });
          break;
        case '库存':
          newmarker = L.marker([equipment.lat, equipment.lng], { icon: customIcons.grey });
          break;
        case '损坏':
          newmarker = L.marker([equipment.lat, equipment.lng], { icon: customIcons.red });
          break;
        case '移动中':
          newmarker = L.marker([equipment.lat, equipment.lng], { icon: customIcons.violet });
          break;
        case '失去联系':
          newmarker = L.marker([equipment.lat, equipment.lng], { icon: customIcons.black });
          break;
        default:
          newmarker = L.marker([equipment.lat, equipment.lng], { icon: customIcons.blue });
      }
      newmarker.bindPopup(`
            <b>${equipment.name}</b><br>
            状态：<span style="color:${equipment.status === '空闲' ? 'green' : 'red'}">${equipment.status}</span><br>
            详情：<span>${equipment.detail}</span><br>
            操作：<button class="schedule-btn" data-id="${equipment.id}">调度</button>
            `).addTo(map);
      newmarker.on('popupopen', () => {
        const btn = newmarker.getPopup().getElement().querySelector('.schedule-btn');
        if (btn) {
          btn.onclick = () => handleSchedule(equipment.id);
        }
      });
      equipmentState[equipment.id].marker = newmarker
    }
    if (mode === 'drag') {
      console.log('draged');
      newmarker = equipmentState[equipment.id].marker;
      equipment = equipmentState[equipment.id].data;
      newmarker.getPopup().setContent(`
        <b>${equipmentState[equipment.id].data.name}</b><br>
        状态：<span style="color:${equipment.status === '空闲' ? 'green' : 'red'}">${equipment.status}</span><br>
        详情：<span>${equipmentState[equipment.id].data.detail}</span><br>
        操作：<button class="schedule-btn" data-id="${equipment.id}">调度</button>
        `);
      const btn = newmarker.getPopup().getElement().querySelector('.schedule-btn');
      if (btn) {
        btn.onclick = () => handleSchedule(equipment.id);
      }
    }
  }

  if (mode === 'WSmarkerupdate') {
    const marker = equipmentState[equipment.id].marker;
    if (marker) {
      if (equipment.status === '空闲') {
        marker.setIcon(customIcons.green);
      } else if (equipment.status === '使用中') {
        marker.setIcon(customIcons.gold);
      } else if (equipment.status === '维护中') {
        marker.setIcon(customIcons.blue)
      } else if (equipment.status === '库存') {
        marker.setIcon(customIcons.grey)
      } else if (equipment.status === '损坏') {
        marker.setIcon(customIcons.red)
      } else if (equipment.status === '移动中') {
        marker.setIcon(customIcons.violet)
      } else {
        marker.setIcon(customIcons.blue)
      }
      marker.getPopup().setContent(`
        <b>${equipmentState[equipment.id].data.name}</b><br>
        状态：<span style="color:${equipment.status === '空闲' ? 'green' : 'red'}">${equipment.status}</span><br>
        详情：<span>${equipmentState[equipment.id].data.detail}</span><br>
        操作：<button class="schedule-btn" data-id="${equipment.id}">调度</button>
        `);
      // 添加空值判断
      const popupElement = marker.getPopup().getElement();
      if (popupElement) {
        const btn = popupElement.querySelector('.schedule-btn');
        if (btn) {
          btn.onclick = () => handleSchedule(equipment.id);
        }
      }
      equipmentState[equipment.id].data.status = equipment.status;
      //别忘了更新装备列表的小球
      const statusElement = document.querySelector(`[data-id="${equipment.id}"] .equipment-status`);
      if (statusElement) {
        statusElement.className = `equipment-status ${equipment.status}`;
      }
    }
  }
}

function handleSchedule(id) {
  const marker = equipmentState[id].marker;
  if (marker) {
    // 启用拖拽并提示
    marker.dragging.enable();
    marker.closePopup();
    showInfo('拖动标记到新位置后释放');

    // 监听拖拽结束事件
    marker.once('dragend', function (e) {
      console.log('拖拽结束');
      marker.dragging.disable();
      const newPos = e.target.getLatLng();

      // 更新本地数据
      equipmentState[id].data.lat = newPos.lat;
      equipmentState[id].data.lng = newPos.lng;

      // 更新后端
      fetch(`http://localhost:1000/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, lat: newPos.lat, lng: newPos.lng, method: 'drag' })
      }).then(() => {
        // 更新装备列表坐标显示
        document.querySelectorAll(`[data-id="${id}"] .equipment-location`)
          .forEach(el => {
            el.textContent = `坐标：${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
          });
        const state = equipmentState[id].data.status
        markerUpdater({ id, state }, 'drag')
      });
    });
  }
}

function wsUpdate(id, status, ...mode) {
  let defaultMode = 'init';
  if (status !== equipmentState[id].data.status) {
    console.log('装备', equipmentState[id].data.name, '更新前：', equipmentState[id].data.status, '更新后：', status);
    defaultMode = 'markerupdate';
  }
  switch (defaultMode) {
    case 'markerupdate':
      markerUpdater({ id, status }, 'WSmarkerupdate');
      console.log('装备数据由wsUpdate更新，当前装备数据：', equipmentState);
      break;
    default:
      break;
  }
}

// WebSocket实时更新处理
const wss = new WebSocket('ws://localhost:1000');
wss.onmessage = (event) => {
  try {
    const { id, status, mode } = JSON.parse(event.data);
    console.log('收到WS信息，解析出data数据：', event.data)
    wsUpdate(id, status, mode);
  } catch (error) {
    console.error('解析WS信息失败', error);
  }
};

//装备列表面板
let isPanelActive = false;
function togglePanel() {
  const body = document.body;
  const panel = document.getElementById('equipment-panel');
  const arrow = document.querySelector('.arrow');

  isPanelActive = !isPanelActive;

  // 切换面板状态
  body.classList.toggle('panel-active', isPanelActive);
  panel.classList.toggle('active', isPanelActive);

  // 更新箭头方向
  arrow.style.transform = isPanelActive
    ? 'translate(-50%, -50%) rotate(180deg)'
    : 'translate(-50%, -50%)';

  // 更新地图尺寸
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 300);

  // 首次打开时加载数据
  if (isPanelActive && document.getElementById('equipment-list').children.length === 0) {
    loadEquipmentList();
  }
}

// 加载装备列表数据
async function loadEquipmentList() {
  try {
    const response = await fetch('http://localhost:1000/api/inventory');
    const equipments = await response.json();
    const container = document.getElementById('equipment-list');
    container.innerHTML = equipments.map(equip => `
      <div class="equipment-card"  data-id="${equip.id}">
        <div class="equipment-status ${equip.status}"></div>
        <div class="equipment-info">
          <div class="equipment-name">${equip.name}</div>
          <div class="equipment-location">坐标：${equip.lat.toFixed(4)}, ${equip.lng.toFixed(4)}</div>
          <div class="equipment-detail">详情：${equipmentState[equip.id].data.detail}</div>
        </div>
      </div>
    `).join('');
  }
  catch (error) {
    console.error('加载装备列表失败:', error);
  }
}
