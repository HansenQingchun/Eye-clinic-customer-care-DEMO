// 庆春眼科客户服务平台 · 应用逻辑
(function () {
  const content = document.getElementById("content");
  const titleEl = document.getElementById("view-title");
  const subEl = document.getElementById("view-sub");
  const modalMask = document.getElementById("modalMask");
  const modal = document.getElementById("modal");

  const VIEW_META = {
    dashboard: ["工作台", "实时掌握诊所客户服务概况"],
    customers: ["客户管理", "管理客户档案、就诊记录与服务标签"],
    chat: ["在线客服", "实时接待客户咨询，智能辅助解答"],
    appointments: ["预约管理", "查看与处理客户预约请求"],
    tickets: ["服务工单", "跟踪客户疑问与服务处理进度"],
    faq: ["知识库", "标准化常见问题解答，赋能客服"],
  };

  let currentView = "dashboard";

  // ---------- 工具 ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const initials = (name) => name.slice(0, 1);
  function statusTag(s) {
    const map = {
      "已确认": "tag-green", "已完成": "tag-blue", "已解决": "tag-green",
      "待确认": "tag-amber", "待处理": "tag-amber", "处理中": "tag-blue", "已取消": "tag-gray",
      "VIP": "tag-amber", "普通": "tag-gray",
      "高": "tag-red", "中": "tag-amber", "低": "tag-gray",
    };
    return `<span class="tag ${map[s] || "tag-gray"}">${esc(s)}</span>`;
  }

  // ---------- 全生命周期流程 ----------
  // 返回某客户当前所处阶段（done 中最后一个）
  function currentStage(id) {
    const j = DB.journeys[id];
    if (!j || !j.done.length) return DB.lifecycleStages[0].key;
    return j.done[j.done.length - 1][0];
  }

  // 渲染流程图。传 id 渲染该客户的个性化旅程；不传则渲染标准流程
  function lifecycleFlow(id, mini) {
    const j = id ? DB.journeys[id] : null;
    const doneMap = {}; (j ? j.done : []).forEach(([k, d]) => doneMap[k] = d);
    const skip = new Set(j ? j.skip : []);
    const curKey = id ? currentStage(id) : null;

    return `<div class="lifecycle ${mini ? "lc-mini" : ""}">` +
      DB.lifecycleStages.map((st, i) => {
        let cls = "lc-pending", date = "";
        if (id) {
          if (doneMap[st.key]) { cls = st.key === curKey ? "lc-current" : "lc-done"; date = doneMap[st.key]; }
          else if (skip.has(st.key)) { cls = "lc-skip"; date = "未涉及"; }
        }
        const conn = i < DB.lifecycleStages.length - 1
          ? `<div class="lc-conn ${id && doneMap[st.key] && st.key !== curKey ? "done" : ""}"></div>` : "";
        return `<div class="lc-stage">
          <div class="lc-node ${cls}" title="${esc(st.desc)}">
            <div class="lc-circle">${st.ico}</div>
            <div class="lc-label">${st.key}</div>
            <div class="lc-date">${date}</div>
          </div>${conn}</div>`;
      }).join("") + `</div>` +
      (id ? "" : `<div class="lc-legend">
        <span><i class="lc-dot" style="background:var(--primary)"></i>已完成</span>
        <span><i class="lc-dot" style="background:var(--accent)"></i>当前阶段</span>
        <span><i class="lc-dot" style="background:#fff;border:1.5px dashed var(--border)"></i>不涉及</span>
        <span><i class="lc-dot" style="background:#fff;border:1.5px solid var(--border)"></i>待进行</span>
      </div>`);
  }

  // ---------- 弹窗 ----------
  function openModal(title, bodyHTML, footHTML) {
    modal.style.width = "";
    modal.innerHTML = `
      <div class="modal-head"><h3>${title}</h3><button class="modal-close" id="mClose">×</button></div>
      <div class="modal-body">${bodyHTML}</div>
      ${footHTML ? `<div class="modal-foot">${footHTML}</div>` : ""}`;
    modalMask.classList.add("show");
    document.getElementById("mClose").onclick = closeModal;
  }
  function closeModal() { modalMask.classList.remove("show"); }
  modalMask.addEventListener("click", (e) => { if (e.target === modalMask) closeModal(); });

  // ---------- 视图渲染 ----------
  const views = {
    dashboard: renderDashboard,
    customers: renderCustomers,
    chat: renderChat,
    appointments: renderAppointments,
    tickets: renderTickets,
    faq: renderFaq,
  };

  function setView(view) {
    currentView = view;
    [titleEl.textContent, subEl.textContent] = VIEW_META[view];
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    views[view]();
  }

  // ===== 工作台 =====
  function renderDashboard() {
    const todayAppts = DB.appointments.filter((a) => a.date === "2026-06-06").length;
    const openTickets = DB.tickets.filter((t) => t.status !== "已解决").length;
    const vip = DB.customers.filter((c) => c.level === "VIP").length;

    const stats = [
      { ico: "👥", label: "客户总数", value: DB.customers.length, trend: "↑ 本月 +12", cls: "up" },
      { ico: "📅", label: "今日预约", value: todayAppts, trend: "3 待确认", cls: "" },
      { ico: "🎫", label: "待处理工单", value: openTickets, trend: "2 高优先级", cls: "down" },
      { ico: "⭐", label: "VIP 客户", value: vip, trend: "满意度 98%", cls: "up" },
    ];

    content.innerHTML = `
      <div class="grid stat-grid">
        ${stats.map((s) => `
          <div class="card stat">
            <div class="stat-ico">${s.ico}</div>
            <div class="stat-label">${s.label}</div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-trend ${s.cls}">${s.trend}</div>
          </div>`).join("")}
      </div>

      <div class="grid two-col" style="margin-top:18px">
        <div class="card">
          <div class="card-head"><h3>📅 今日 / 近期预约</h3><button class="btn-ghost" data-go="appointments">查看全部</button></div>
          <div class="card-body" style="padding-top:0">
            <table>
              <thead><tr><th>客户</th><th>时间</th><th>项目</th><th>院区</th><th>状态</th></tr></thead>
              <tbody>
                ${DB.appointments.slice(0, 5).map((a) => `
                  <tr><td>${esc(a.customer)}</td><td>${a.date.slice(5)} ${a.time}</td><td>${esc(a.item)}</td><td>${esc(a.clinic)}</td><td>${statusTag(a.status)}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>🎫 待处理工单</h3><button class="btn-ghost" data-go="tickets">进入工单</button></div>
          <div class="card-body">
            ${DB.tickets.filter((t) => t.status !== "已解决").map((t) => `
              <div class="timeline-item">
                <div class="tl-dot" style="background:${t.priority === "高" ? "var(--red)" : "var(--primary)"}"></div>
                <div class="tl-text">
                  <div><strong>${esc(t.title)}</strong> ${statusTag(t.priority)}</div>
                  <div class="tl-time">${esc(t.customer)} · ${esc(t.channel)} · ${t.created}</div>
                </div>
              </div>`).join("")}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="card-head"><h3>📈 各院区客户分布</h3></div>
        <div class="card-body">
          ${DB.clinics.map((cl) => {
            const n = DB.customers.filter((c) => c.clinic === cl).length;
            const pct = Math.round((n / DB.customers.length) * 100);
            return `<div style="margin-bottom:14px">
              <div style="display:flex;justify-content:space-between;font-size:13.5px"><span>${cl}</span><span class="muted">${n} 人 · ${pct}%</span></div>
              <div class="progress"><span style="width:${pct}%"></span></div></div>`;
          }).join("")}
        </div>
      </div>`;

    content.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => setView(b.dataset.go));
  }

  // ===== 客户管理 =====
  function renderCustomers(filterText = "") {
    const ft = filterText.toLowerCase();
    const list = DB.customers.filter((c) =>
      !ft || c.name.toLowerCase().includes(ft) || c.id.toLowerCase().includes(ft) || c.tags.join("").toLowerCase().includes(ft));

    content.innerHTML = `
      <div class="card" style="margin-bottom:18px">
        <div class="card-head">
          <h3>🔄 客户全生命周期流程</h3>
          <button class="btn-ghost" id="lcToggle">展开/收起</button>
        </div>
        <div class="card-body" id="lcPanel">
          ${lifecycleFlow(null)}
          <div class="section-title">各阶段客户分布</div>
          <div class="grid" style="grid-template-columns:repeat(7,1fr);gap:10px" id="lcDist"></div>
          <p class="muted" style="margin-top:10px">说明：诊所以「客户旅程」为核心驱动服务 —— 从首诊建档到长期健康管理，每个阶段自动触发对应的随访、提醒与关怀动作。点击下方客户可查看其个性化旅程。</p>
        </div>
      </div>
      <div class="toolbar">
        <input class="filter-sel" id="custSearch" placeholder="🔍 搜索姓名 / 编号 / 标签" style="min-width:240px" value="${esc(filterText)}" />
        <select class="filter-sel" id="custClinic">
          <option value="">全部院区</option>${DB.clinics.map((c) => `<option>${c}</option>`).join("")}
        </select>
        <select class="filter-sel" id="custLevel"><option value="">全部等级</option><option>VIP</option><option>普通</option></select>
        <select class="filter-sel" id="custStage"><option value="">全部阶段</option>${DB.lifecycleStages.map((s) => `<option>${s.key}</option>`).join("")}</select>
        <div style="flex:1"></div>
        <button class="btn-primary" id="addCust">＋ 新增客户</button>
      </div>
      <div class="card">
        <table>
          <thead><tr><th>客户</th><th>编号</th><th>性别/年龄</th><th>联系电话</th><th>所属院区</th><th>等级</th><th>生命周期阶段</th><th>最近就诊</th></tr></thead>
          <tbody id="custBody"></tbody>
        </table>
      </div>`;

    // 各阶段分布
    document.getElementById("lcDist").innerHTML = DB.lifecycleStages.map((st) => {
      const n = DB.customers.filter((c) => currentStage(c.id) === st.key).length;
      return `<div class="card stat" style="padding:12px;align-items:center;text-align:center">
        <div style="font-size:20px">${st.ico}</div>
        <div class="stat-value" style="font-size:22px">${n}</div>
        <div class="stat-label" style="font-size:12px">${st.key}</div></div>`;
    }).join("");
    document.getElementById("lcToggle").onclick = () => {
      const p = document.getElementById("lcPanel"); p.style.display = p.style.display === "none" ? "" : "none";
    };

    function paint(rows) {
      const body = document.getElementById("custBody");
      if (!rows.length) { body.innerHTML = `<tr><td colspan="8" class="empty">未找到匹配的客户</td></tr>`; return; }
      body.innerHTML = rows.map((c) => `
        <tr class="row-click" data-id="${c.id}">
          <td><span class="cell-name"><span class="avatar-sm">${initials(c.name)}</span>${esc(c.name)}</span></td>
          <td>${c.id}</td><td>${c.gender} / ${c.age}</td><td>${c.phone}</td><td>${esc(c.clinic)}</td>
          <td>${statusTag(c.level)}</td>
          <td><span class="tag tag-blue">${currentStage(c.id)}</span></td>
          <td>${c.lastVisit}</td>
        </tr>`).join("");
      body.querySelectorAll(".row-click").forEach((r) => r.onclick = () => showCustomer(r.dataset.id));
    }
    paint(list);

    function applyFilters() {
      const t = document.getElementById("custSearch").value.toLowerCase();
      const cl = document.getElementById("custClinic").value;
      const lv = document.getElementById("custLevel").value;
      const sg = document.getElementById("custStage").value;
      paint(DB.customers.filter((c) =>
        (!t || c.name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t) || c.tags.join("").toLowerCase().includes(t)) &&
        (!cl || c.clinic === cl) && (!lv || c.level === lv) && (!sg || currentStage(c.id) === sg)));
    }
    document.getElementById("custSearch").oninput = applyFilters;
    document.getElementById("custClinic").onchange = applyFilters;
    document.getElementById("custLevel").onchange = applyFilters;
    document.getElementById("custStage").onchange = applyFilters;
    document.getElementById("addCust").onclick = addCustomerModal;
  }

  function showCustomer(id) {
    const c = DB.customers.find((x) => x.id === id);
    const appts = DB.appointments.filter((a) => a.customer === c.name);
    const body = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div class="avatar-sm" style="width:56px;height:56px;font-size:20px">${initials(c.name)}</div>
        <div><div style="font-size:18px;font-weight:700">${esc(c.name)} ${statusTag(c.level)}</div>
        <div class="muted">${c.gender} · ${c.age}岁 · ${c.id}</div></div>
      </div>
      <div class="info-row"><span class="k">联系电话</span><span>${c.phone}</span></div>
      <div class="info-row"><span class="k">所属院区</span><span>${esc(c.clinic)}</span></div>
      <div class="info-row"><span class="k">就诊次数</span><span>${c.visits} 次</span></div>
      <div class="info-row"><span class="k">累计消费</span><span>¥ ${c.spend.toLocaleString()}</span></div>
      <div class="info-row"><span class="k">服务标签</span><span>${c.tags.map((t) => `<span class="tag tag-blue" style="margin-left:4px">${esc(t)}</span>`).join("")}</span></div>
      <div class="section-title">客户全生命周期旅程 · 当前：<span style="color:var(--accent)">${currentStage(c.id)}</span></div>
      ${lifecycleFlow(c.id, true)}
      <div class="section-title">客户备注</div>
      <div style="background:var(--bg);padding:12px;border-radius:10px;line-height:1.6">${esc(c.notes)}</div>
      <div class="section-title">预约记录</div>
      ${appts.length ? appts.map((a) => `<div class="info-row"><span class="k">${a.date} ${a.time} · ${esc(a.item)}</span>${statusTag(a.status)}</div>`).join("") : `<div class="muted">暂无预约记录</div>`}`;
    openModal("客户档案", body, `<button class="btn-ghost" onclick="document.getElementById('mClose').click()">关闭</button><button class="btn-primary" id="custToChat">发起服务</button>`);
    modal.style.width = "660px";
    document.getElementById("custToChat").onclick = () => { closeModal(); setView("chat"); };
  }

  function addCustomerModal() {
    const body = `
      <div class="field"><label>姓名</label><input id="f_name" placeholder="请输入客户姓名" /></div>
      <div style="display:flex;gap:12px">
        <div class="field" style="flex:1"><label>性别</label><select id="f_gender"><option>男</option><option>女</option></select></div>
        <div class="field" style="flex:1"><label>年龄</label><input id="f_age" type="number" placeholder="年龄" /></div>
      </div>
      <div class="field"><label>联系电话</label><input id="f_phone" placeholder="手机号" /></div>
      <div class="field"><label>所属院区</label><select id="f_clinic">${DB.clinics.map((c) => `<option>${c}</option>`).join("")}</select></div>
      <div class="field"><label>等级</label><select id="f_level"><option>普通</option><option>VIP</option></select></div>
      <div class="field"><label>备注</label><textarea id="f_notes" rows="2" placeholder="主诉 / 服务备注"></textarea></div>`;
    openModal("新增客户", body, `<button class="btn-ghost" id="cAdd">取消</button><button class="btn-primary" id="sAdd">保存</button>`);
    document.getElementById("cAdd").onclick = closeModal;
    document.getElementById("sAdd").onclick = () => {
      const name = document.getElementById("f_name").value.trim();
      if (!name) { alert("请输入姓名"); return; }
      DB.customers.unshift({
        id: "C" + (1000 + DB.customers.length + 1), name,
        gender: document.getElementById("f_gender").value,
        age: +document.getElementById("f_age").value || 0,
        phone: document.getElementById("f_phone").value || "—",
        level: document.getElementById("f_level").value,
        clinic: document.getElementById("f_clinic").value,
        lastVisit: "2026-06-05", tags: ["新建档"],
        notes: document.getElementById("f_notes").value || "（暂无备注）", visits: 0, spend: 0,
      });
      closeModal(); renderCustomers();
    };
  }

  // ===== 在线客服 =====
  let activeConv = DB.conversations[0].id;
  function renderChat() {
    content.innerHTML = `
      <div class="chat-wrap">
        <div class="chat-list" id="chatList"></div>
        <div class="chat-main">
          <div class="chat-head" id="chatHead"></div>
          <div class="chat-body" id="chatBody"></div>
          <div class="quick-replies" id="quickReplies"></div>
          <div class="chat-input">
            <input id="chatInput" placeholder="输入回复内容，或试试问“近视手术多少钱”…" />
            <button class="btn-primary" id="sendBtn">发送</button>
          </div>
        </div>
      </div>`;
    paintConvList();
    paintConv();
    const quick = ["营业时间？", "近视手术多少钱？", "怎么预约？", "干眼怎么办？"];
    document.getElementById("quickReplies").innerHTML = quick.map((q) => `<button class="chip">${q}</button>`).join("");
    document.querySelectorAll(".chip").forEach((c) => c.onclick = () => { sendMessage(c.textContent, true); });

    const input = document.getElementById("chatInput");
    document.getElementById("sendBtn").onclick = () => { if (input.value.trim()) { sendMessage(input.value.trim(), true); input.value = ""; } };
    input.onkeydown = (e) => { if (e.key === "Enter" && input.value.trim()) { sendMessage(input.value.trim(), true); input.value = ""; } };
  }

  function paintConvList() {
    document.getElementById("chatList").innerHTML = DB.conversations.map((c) => `
      <div class="chat-list-item ${c.id === activeConv ? "active" : ""}" data-id="${c.id}">
        <div class="avatar-sm">${c.avatar}</div>
        <div><div class="cli-name">${esc(c.name)}</div><div class="cli-last">${esc(c.last)}</div></div>
      </div>`).join("");
    document.querySelectorAll(".chat-list-item").forEach((it) => it.onclick = () => { activeConv = it.dataset.id; paintConvList(); paintConv(); });
  }

  function paintConv() {
    const c = DB.conversations.find((x) => x.id === activeConv);
    document.getElementById("chatHead").innerHTML = `<div class="avatar-sm">${c.avatar}</div><div><div class="cli-name">${esc(c.name)}</div><div class="muted">客户咨询中</div></div>`;
    const bodyEl = document.getElementById("chatBody");
    bodyEl.innerHTML = c.messages.map((m) => `
      <div class="msg ${m.side}">${esc(m.text)}<div class="msg-time">${m.time}</div></div>`).join("");
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  // 简易客服机器人：先发坐席消息，再给出知识库建议回复
  function botReply(text) {
    const t = text.toLowerCase();
    for (const rule of DB.botRules) {
      if (rule.keys.some((k) => t.includes(k.toLowerCase()))) return rule.reply;
    }
    return "您的问题我已记录，正在为您转接专业顾问。您也可以补充更多信息（如就诊院区、症状），方便我们更好地为您解答～";
  }

  function sendMessage(text, isAgent) {
    const c = DB.conversations.find((x) => x.id === activeConv);
    const now = new Date().toTimeString().slice(0, 5);
    c.messages.push({ side: isAgent ? "out" : "in", text, time: now });
    c.last = text;
    paintConv(); paintConvList();
    // 模拟客户追问 + 智能建议回复
    setTimeout(() => {
      const reply = botReply(text);
      c.messages.push({ side: "out", text: "💡 [智能助手建议] " + reply, time: new Date().toTimeString().slice(0, 5) });
      c.last = reply;
      paintConv(); paintConvList();
    }, 600);
  }

  // ===== 预约管理 =====
  function renderAppointments() {
    content.innerHTML = `
      <div class="toolbar">
        <select class="filter-sel" id="apStatus"><option value="">全部状态</option><option>待确认</option><option>已确认</option><option>已完成</option></select>
        <div style="flex:1"></div>
        <button class="btn-primary" id="addAppt">＋ 新建预约</button>
      </div>
      <div class="card"><table>
        <thead><tr><th>编号</th><th>客户</th><th>电话</th><th>日期</th><th>时间</th><th>项目</th><th>医生</th><th>院区</th><th>状态</th><th>操作</th></tr></thead>
        <tbody id="apBody"></tbody>
      </table></div>`;

    function paint() {
      const st = document.getElementById("apStatus").value;
      const rows = DB.appointments.filter((a) => !st || a.status === st);
      document.getElementById("apBody").innerHTML = rows.map((a) => `
        <tr><td>${a.id}</td><td>${esc(a.customer)}</td><td>${a.phone}</td><td>${a.date}</td><td>${a.time}</td>
        <td>${esc(a.item)}</td><td>${esc(a.doctor)}</td><td>${esc(a.clinic)}</td><td>${statusTag(a.status)}</td>
        <td>${a.status === "待确认" ? `<button class="btn-ghost" data-confirm="${a.id}" style="padding:5px 10px">确认</button>` : `<span class="muted">—</span>`}</td></tr>`).join("");
      document.querySelectorAll("[data-confirm]").forEach((b) => b.onclick = () => {
        DB.appointments.find((x) => x.id === b.dataset.confirm).status = "已确认"; paint();
      });
    }
    paint();
    document.getElementById("apStatus").onchange = paint;
    document.getElementById("addAppt").onclick = () => {
      const body = `
        <div class="field"><label>客户姓名</label><input id="a_name" /></div>
        <div class="field"><label>联系电话</label><input id="a_phone" /></div>
        <div style="display:flex;gap:12px">
          <div class="field" style="flex:1"><label>日期</label><input id="a_date" type="date" value="2026-06-07" /></div>
          <div class="field" style="flex:1"><label>时间</label><input id="a_time" type="time" value="10:00" /></div>
        </div>
        <div class="field"><label>就诊项目</label><input id="a_item" placeholder="如：近视手术术前检查" /></div>
        <div class="field"><label>院区</label><select id="a_clinic">${DB.clinics.map((c) => `<option>${c}</option>`).join("")}</select></div>`;
      openModal("新建预约", body, `<button class="btn-ghost" id="apC">取消</button><button class="btn-primary" id="apS">提交</button>`);
      document.getElementById("apC").onclick = closeModal;
      document.getElementById("apS").onclick = () => {
        const name = document.getElementById("a_name").value.trim();
        if (!name) { alert("请输入客户姓名"); return; }
        DB.appointments.unshift({
          id: "A" + (2000 + DB.appointments.length + 1), customer: name,
          phone: document.getElementById("a_phone").value || "—",
          date: document.getElementById("a_date").value, time: document.getElementById("a_time").value,
          item: document.getElementById("a_item").value || "门诊咨询", doctor: "待分配",
          clinic: document.getElementById("a_clinic").value, status: "待确认",
        });
        closeModal(); renderAppointments();
      };
    };
  }

  // ===== 服务工单 =====
  function renderTickets() {
    content.innerHTML = `
      <div class="toolbar">
        <select class="filter-sel" id="tkStatus"><option value="">全部状态</option><option>待处理</option><option>处理中</option><option>已解决</option></select>
        <select class="filter-sel" id="tkPrio"><option value="">全部优先级</option><option>高</option><option>中</option><option>低</option></select>
        <div style="flex:1"></div>
        <button class="btn-primary" id="addTk">＋ 新建工单</button>
      </div>
      <div class="card"><table>
        <thead><tr><th>编号</th><th>客户</th><th>主题</th><th>渠道</th><th>优先级</th><th>负责人</th><th>创建时间</th><th>状态</th></tr></thead>
        <tbody id="tkBody"></tbody>
      </table></div>`;

    function paint() {
      const st = document.getElementById("tkStatus").value;
      const pr = document.getElementById("tkPrio").value;
      const rows = DB.tickets.filter((t) => (!st || t.status === st) && (!pr || t.priority === pr));
      const body = document.getElementById("tkBody");
      if (!rows.length) { body.innerHTML = `<tr><td colspan="8" class="empty">暂无工单</td></tr>`; return; }
      body.innerHTML = rows.map((t) => `
        <tr class="row-click" data-id="${t.id}"><td>${t.id}</td><td>${esc(t.customer)}</td><td>${esc(t.title)}</td>
        <td>${esc(t.channel)}</td><td>${statusTag(t.priority)}</td><td>${esc(t.owner)}</td><td>${t.created}</td><td>${statusTag(t.status)}</td></tr>`).join("");
      body.querySelectorAll(".row-click").forEach((r) => r.onclick = () => showTicket(r.dataset.id));
    }
    paint();
    document.getElementById("tkStatus").onchange = paint;
    document.getElementById("tkPrio").onchange = paint;
    document.getElementById("addTk").onclick = () => {
      const body = `
        <div class="field"><label>客户</label><input id="t_cust" /></div>
        <div class="field"><label>主题</label><input id="t_title" placeholder="问题简述" /></div>
        <div style="display:flex;gap:12px">
          <div class="field" style="flex:1"><label>渠道</label><select id="t_ch"><option>在线客服</option><option>电话</option><option>微信</option><option>前台</option></select></div>
          <div class="field" style="flex:1"><label>优先级</label><select id="t_pr"><option>中</option><option>高</option><option>低</option></select></div>
        </div>
        <div class="field"><label>问题描述</label><textarea id="t_desc" rows="3"></textarea></div>`;
      openModal("新建工单", body, `<button class="btn-ghost" id="tkC">取消</button><button class="btn-primary" id="tkS">创建</button>`);
      document.getElementById("tkC").onclick = closeModal;
      document.getElementById("tkS").onclick = () => {
        const title = document.getElementById("t_title").value.trim();
        if (!title) { alert("请输入主题"); return; }
        DB.tickets.unshift({
          id: "T" + (3000 + DB.tickets.length + 1), customer: document.getElementById("t_cust").value || "匿名客户",
          title, channel: document.getElementById("t_ch").value, priority: document.getElementById("t_pr").value,
          status: "待处理", owner: "未分配", created: "2026-06-05 10:30", desc: document.getElementById("t_desc").value || "（无描述）",
        });
        closeModal(); renderTickets();
      };
    };
  }

  function showTicket(id) {
    const t = DB.tickets.find((x) => x.id === id);
    const body = `
      <div style="font-size:17px;font-weight:700;margin-bottom:6px">${esc(t.title)}</div>
      <div style="margin-bottom:14px">${statusTag(t.status)} ${statusTag(t.priority)} <span class="tag tag-gray">${esc(t.channel)}</span></div>
      <div class="info-row"><span class="k">工单编号</span><span>${t.id}</span></div>
      <div class="info-row"><span class="k">客户</span><span>${esc(t.customer)}</span></div>
      <div class="info-row"><span class="k">负责人</span><span>${esc(t.owner)}</span></div>
      <div class="info-row"><span class="k">创建时间</span><span>${t.created}</span></div>
      <div class="section-title">问题描述</div>
      <div style="background:var(--bg);padding:12px;border-radius:10px;line-height:1.6">${esc(t.desc)}</div>
      <div class="section-title">处理回复</div>
      <textarea id="tkReply" rows="3" style="width:100%;border:1px solid var(--border);border-radius:9px;padding:10px;font-family:inherit" placeholder="填写处理结果 / 回复客户内容"></textarea>`;
    const foot = `
      ${t.status !== "已解决" ? `<button class="btn-ghost" id="tkTake">认领</button><button class="btn-primary" id="tkResolve">标记已解决</button>` : `<button class="btn-ghost" onclick="document.getElementById('mClose').click()">关闭</button>`}`;
    openModal("工单详情", body, foot);
    if (t.status !== "已解决") {
      document.getElementById("tkTake").onclick = () => { t.owner = "林晓客服"; t.status = "处理中"; closeModal(); renderTickets(); };
      document.getElementById("tkResolve").onclick = () => { t.status = "已解决"; if (t.owner === "未分配") t.owner = "林晓客服"; closeModal(); renderTickets(); };
    }
  }

  // ===== 知识库（内部 / 外部）=====
  let kbTab = "internal";
  function renderFaq() {
    const intN = DB.faq.length;
    const extImported = DB.externalKb.filter((e) => e.status === "已引入").length;
    content.innerHTML = `
      <div class="kb-source-bar">
        <div class="kb-src-card"><div class="kb-src-num">${intN}</div><div class="kb-src-lbl">📗 内部知识条目</div></div>
        <div class="kb-src-card"><div class="kb-src-num">${extImported}</div><div class="kb-src-lbl">🌐 已引入外部知识源</div></div>
        <div class="kb-src-card"><div class="kb-src-num">${DB.externalKb.length}</div><div class="kb-src-lbl">🔗 可对接外部源</div></div>
        <div class="kb-src-card"><div class="kb-src-num">98%</div><div class="kb-src-lbl">✅ 客服解答采纳率</div></div>
      </div>
      <div class="kb-tabs">
        <button class="kb-tab ${kbTab === "internal" ? "active" : ""}" data-tab="internal">📗 内部知识库</button>
        <button class="kb-tab ${kbTab === "external" ? "active" : ""}" data-tab="external">🌐 外部知识库</button>
      </div>
      <div id="kbContent"></div>`;
    content.querySelectorAll(".kb-tab").forEach((b) => b.onclick = () => { kbTab = b.dataset.tab; renderFaq(); });
    kbTab === "internal" ? paintInternal() : paintExternal();
  }

  function paintInternal() {
    const cats = [...new Set(DB.faq.map((f) => f.cat))];
    document.getElementById("kbContent").innerHTML = `
      <div class="toolbar">
        <input class="filter-sel" id="faqSearch" placeholder="🔍 搜索内部问答关键词" style="min-width:280px" />
        <select class="filter-sel" id="faqCat"><option value="">全部分类</option>${cats.map((c) => `<option>${c}</option>`).join("")}</select>
        <span class="muted">诊所标准话术 · 已审核，客服可直接引用</span>
      </div>
      <div id="faqList"></div>`;
    function paint() {
      const t = document.getElementById("faqSearch").value.toLowerCase();
      const cat = document.getElementById("faqCat").value;
      const rows = DB.faq.filter((f) => (!cat || f.cat === cat) && (!t || f.q.toLowerCase().includes(t) || f.a.toLowerCase().includes(t)));
      const el = document.getElementById("faqList");
      if (!rows.length) { el.innerHTML = `<div class="empty">未找到相关问答</div>`; return; }
      el.innerHTML = rows.map((f) => `
        <div class="faq-item">
          <div class="faq-q"><span><span class="faq-cat">#${esc(f.cat)}</span>${esc(f.q)}${f.imported ? ` <span class="tag tag-amber" style="margin-left:6px">外部引入</span>` : ""}</span><span>＋</span></div>
          <div class="faq-a">${esc(f.a)}${f.src ? `<div class="muted" style="margin-top:8px">来源：${esc(f.src)}</div>` : ""}</div>
        </div>`).join("");
      el.querySelectorAll(".faq-item").forEach((it) => it.querySelector(".faq-q").onclick = () => it.classList.toggle("open"));
    }
    paint();
    document.getElementById("faqSearch").oninput = paint;
    document.getElementById("faqCat").onchange = paint;
  }

  function paintExternal() {
    const typeIco = { "政策指南": "📜", "临床指南": "🩺", "研究报告": "🌍", "循证医学": "🔬", "学术文献": "📄" };
    document.getElementById("kbContent").innerHTML = `
      <div class="toolbar">
        <input class="filter-sel" id="extSearch" placeholder="🔍 搜索外部知识源 / 标题" style="min-width:280px" />
        <select class="filter-sel" id="extStatus"><option value="">全部状态</option><option>已引入</option><option>可引入</option></select>
        <div style="flex:1"></div>
        <button class="btn-primary" id="addExt">＋ 引入外部知识库</button>
      </div>
      <p class="muted" style="margin:-6px 0 16px">对接国家卫健委、医学学会指南库、WHO、循证医学数据库等权威外部知识源，引入后可同步至客服解答与智能助手。</p>
      <div id="extList"></div>`;

    function paint() {
      const t = document.getElementById("extSearch").value.toLowerCase();
      const st = document.getElementById("extStatus").value;
      const rows = DB.externalKb.filter((e) => (!st || e.status === st) && (!t || e.title.toLowerCase().includes(t) || e.source.toLowerCase().includes(t)));
      const el = document.getElementById("extList");
      if (!rows.length) { el.innerHTML = `<div class="empty">未找到外部知识源</div>`; return; }
      el.innerHTML = rows.map((e) => `
        <div class="ext-item">
          <div class="ext-ico">${typeIco[e.type] || "🔗"}</div>
          <div class="ext-body">
            <div class="ext-title">${esc(e.title)}</div>
            <div class="ext-meta">${esc(e.source)} · <span class="tag tag-gray">${esc(e.type)}</span> <span class="tag tag-blue">${esc(e.trust)}</span> · 更新 ${e.updated} · 🔗 ${esc(e.url)}</div>
            <div class="ext-summary">${esc(e.summary)}</div>
          </div>
          <div class="ext-actions">
            ${statusTag(e.status)}
            ${e.status === "可引入"
              ? `<button class="btn-primary" data-import="${e.id}" style="padding:7px 14px">引入</button>`
              : `<button class="btn-ghost" data-tofaq="${e.id}" style="padding:7px 12px">转入内部话术</button>`}
          </div>
        </div>`).join("");
      el.querySelectorAll("[data-import]").forEach((b) => b.onclick = () => {
        DB.externalKb.find((x) => x.id === b.dataset.import).status = "已引入"; renderFaq();
      });
      el.querySelectorAll("[data-tofaq]").forEach((b) => b.onclick = () => {
        const e = DB.externalKb.find((x) => x.id === b.dataset.tofaq);
        if (DB.faq.some((f) => f.q === e.title)) { alert("该内容已在内部知识库中"); return; }
        DB.faq.push({ cat: e.type, q: e.title, a: e.summary, imported: true, src: e.source });
        alert("已转入内部知识库，客服可直接引用～");
        renderFaq();
      });
    }
    paint();
    document.getElementById("extSearch").oninput = paint;
    document.getElementById("extStatus").onchange = paint;
    document.getElementById("addExt").onclick = addExternalModal;
  }

  function addExternalModal() {
    const body = `
      <p class="muted" style="margin-bottom:14px">填写外部知识源信息以接入平台。引入后可在客服解答中引用并标注来源。</p>
      <div class="field"><label>知识源机构</label><input id="x_src" placeholder="如：国家卫生健康委员会 / WHO / 中华医学会" /></div>
      <div class="field"><label>资料标题</label><input id="x_title" placeholder="指南 / 文献 / 报告名称" /></div>
      <div style="display:flex;gap:12px">
        <div class="field" style="flex:1"><label>类型</label><select id="x_type"><option>政策指南</option><option>临床指南</option><option>研究报告</option><option>循证医学</option><option>学术文献</option></select></div>
        <div class="field" style="flex:1"><label>可信度</label><select id="x_trust"><option>权威</option><option>国际</option><option>学术</option></select></div>
      </div>
      <div class="field"><label>来源链接</label><input id="x_url" placeholder="example.org" /></div>
      <div class="field"><label>内容摘要</label><textarea id="x_sum" rows="3" placeholder="该知识源的核心内容简介"></textarea></div>`;
    openModal("引入外部知识库", body, `<button class="btn-ghost" id="xC">取消</button><button class="btn-primary" id="xS">引入</button>`);
    document.getElementById("xC").onclick = closeModal;
    document.getElementById("xS").onclick = () => {
      const title = document.getElementById("x_title").value.trim();
      const src = document.getElementById("x_src").value.trim();
      if (!title || !src) { alert("请填写机构与标题"); return; }
      DB.externalKb.unshift({
        id: "EX" + (DB.externalKb.length + 1), source: src, type: document.getElementById("x_type").value,
        title, summary: document.getElementById("x_sum").value || "（暂无摘要）",
        url: document.getElementById("x_url").value || "—", updated: "2026-06", status: "已引入",
        trust: document.getElementById("x_trust").value,
      });
      closeModal(); kbTab = "external"; renderFaq();
    };
  }

  // ---------- 全局交互 ----------
  document.querySelectorAll(".nav-item").forEach((b) => b.onclick = () => setView(b.dataset.view));

  document.getElementById("globalSearch").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = e.target.value.trim();
    if (!q) return;
    setView("customers");
    setTimeout(() => { const i = document.getElementById("custSearch"); if (i) { i.value = q; i.dispatchEvent(new Event("input")); } }, 50);
  });

  document.getElementById("quickNew").onclick = () => {
    if (currentView === "appointments") return document.getElementById("addAppt")?.click();
    if (currentView === "tickets") return document.getElementById("addTk")?.click();
    addCustomerModal();
  };

  // 启动
  setView("dashboard");
})();
