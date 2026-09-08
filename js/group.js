/* ============================================================
   Global School of Yoga — Rhythmic / Artistic Group Registration
   ============================================================ */
(function () {
  "use strict";
  let ctx = null;
  let initialized = false;

  function waitForContext() {
    if (window.GSYGroupContext) {
      ctx = window.GSYGroupContext;
      initialize();
    } else setTimeout(waitForContext, 100);
  }

  function initialize() {
    if (initialized || !ctx) return;
    initialized = true;

    const cards = document.querySelectorAll('.mode-card[data-mode="Rhythmic"], .mode-card[data-mode="Artistic"]');
    cards.forEach(card => card.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      start(card.dataset.mode || "");
    }, true));

    document.getElementById("Group_VerifyBtn_")?.addEventListener("click", verifyParticipants);
    document.getElementById("Group_ProceedToPaymentBtn_")?.addEventListener("click", createPaymentLink);
    document.getElementById("Group_BackToModeBtn_")?.addEventListener("click", backToMode);
    reset();
  }

  function state() {
    if (!window.GSYGroupState) window.GSYGroupState = {};
    return window.GSYGroupState;
  }

  function reset() {
    window.GSYGroupState = { mode: "", participants: [], events: [], selectedEventIds: [] };
    const panel = document.getElementById("Group_Panel_");
    const eventSection = document.getElementById("Group_EventSection_");
    const list = document.getElementById("Group_ParticipantInputs_");
    const verified = document.getElementById("Group_VerifiedParticipants_");
    const events = document.getElementById("Group_EventList_");
    const summary = document.getElementById("Group_SelectionSummary_");
    const proceed = document.getElementById("Group_ProceedToPaymentBtn_");
    if (panel) { panel.classList.add("hidden"); panel.style.display = ""; }
    if (eventSection) { eventSection.classList.add("hidden"); eventSection.style.display = "none"; }
    if (list) list.innerHTML = "";
    if (verified) verified.textContent = "";
    if (events) events.innerHTML = "";
    if (summary) summary.classList.add("hidden");
    if (proceed) { proceed.disabled = true; proceed.textContent = "💳 Proceed to Payment"; }
  }

  function start(mode) {
    reset();
    const st = state(); st.mode = mode;
    const panel = document.getElementById("Group_Panel_");
    const title = document.getElementById("Group_Title_");
    const subtitle = document.getElementById("Group_Subtitle_");
    const help = document.getElementById("Group_ModeHelp_");
    const list = document.getElementById("Group_ParticipantInputs_");
    if (panel) { panel.classList.remove("hidden"); panel.style.display = "block"; }
    if (ctx.cataloguePanel) ctx.cataloguePanel.classList.add("hidden");
    if (ctx.joinPanel) ctx.joinPanel.classList.add("hidden");

    const minAdditional = mode === "Rhythmic" ? 4 : 5;
    const maxAdditional = mode === "Rhythmic" ? 4 : 11;
    const totalMin = mode === "Rhythmic" ? 5 : 6;
    const totalMax = mode === "Rhythmic" ? 5 : 12;
    title.textContent = mode === "Rhythmic" ? "Rhythmic Group Registration" : "Artistic Group Registration";
    subtitle.textContent = `Enter ${minAdditional}${maxAdditional !== minAdditional ? " to " + maxAdditional : ""} additional Participant IDs.`;
    help.textContent = `Your group will contain ${totalMin}${totalMax !== totalMin ? " to " + totalMax : ""} participants including you.`;

    for (let i = 1; i <= maxAdditional; i++) {
      const wrap = document.createElement("div");
      wrap.style.marginBottom = "10px";
      if (mode === "Rhythmic" && i > 4) wrap.style.display = "none";
      wrap.innerHTML = `<input type="text" data-group-member="${i}" placeholder="Partner Participant ID ${i}" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;box-sizing:border-box;">`;
      list.appendChild(wrap);
    }
    if (mode === "Artistic") {
      const note = document.createElement("div");
      note.style.marginTop = "6px";
      note.textContent = "Minimum 5 additional participants; maximum 11 additional participants.";
      list.appendChild(note);
    }
  }

  async function verifyParticipants() {
    const st = state();
    if (!st.mode) return;
    const ids = Array.from(document.querySelectorAll('[data-group-member]')).map(i => i.value.trim().toUpperCase()).filter(Boolean);
    const min = st.mode === "Rhythmic" ? 4 : 5;
    const max = st.mode === "Rhythmic" ? 4 : 11;
    if (ids.length < min || ids.length > max) {
      show(`Please enter ${min}${max !== min ? " to " + max : ""} additional Participant IDs.`);
      return;
    }
    if (new Set(ids).size !== ids.length) {
      show("Each Participant ID must be unique."); return;
    }
    const btn = document.getElementById("Group_VerifyBtn_");
    if (btn) { btn.disabled = true; btn.textContent = "Verifying..."; }
    try {
      const token = await ctx.auth.currentUser.getIdToken(true);
      const response = await fetch(ctx.APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify({action:"Group_VerifyParticipants", idToken:token, mode:st.mode, participantIds:ids}) });
      const text = await response.text();
      const data = JSON.parse(text);
      if (!data.success) throw new Error(data.message || "Unable to verify participants.");
      st.participants = data.participants || [];
      renderVerified();
      await loadEvents();
    } catch (e) { console.error("Group_VerifyParticipants:", e); show(e.message || "Unable to verify participants."); }
    finally { if (btn) { btn.disabled = false; btn.textContent = "🔎 Verify Participants"; } }
  }

  function renderVerified() {
    const target = document.getElementById("Group_VerifiedParticipants_");
    if (!target) return;
    target.innerHTML = `<strong>Verified participants:</strong> ${state().participants.map(p => `${escapeHtml(p.participantId)} — ${escapeHtml(p.fullName || "")}`).join("; ")}`;
  }

  async function loadEvents() {
    const st = state();
    const file = st.mode === "Rhythmic" ? "rhythmic.json" : "artistic.json";
    let response = await fetch("data/" + file, {cache:"no-store"});
    if (!response.ok && st.mode === "Rhythmic") response = await fetch("data/rythmic.json", {cache:"no-store"});
    if (!response.ok) throw new Error(`Unable to load ${file}.`);
    const catalogue = await response.json();
    if (!catalogue || !Array.isArray(catalogue.events) || catalogue.events.length !== 1) throw new Error("The group catalogue must contain exactly one event.");
    st.events = catalogue.events;
    const section = document.getElementById("Group_EventSection_");
    if (section) { section.classList.remove("hidden"); section.style.display = "block"; }
    const msg = document.getElementById("Group_EventMessage_"); if (msg) msg.textContent = catalogue.selectionMessage || "Select the event to continue.";
    const list = document.getElementById("Group_EventList_"); if (!list) return;
    list.innerHTML = "";
    const ev = catalogue.events[0];
    const row = document.createElement("label"); row.style.display="block"; row.style.padding="12px"; row.style.border="1px solid #ddd"; row.style.borderRadius="8px";
    const cb = document.createElement("input"); cb.type="checkbox"; cb.dataset.eventId=ev.eventId; cb.style.marginRight="10px"; cb.addEventListener("change", updateSelection);
    const perPerson = Number(ev.perPersonFee || catalogue.perPersonFee || 1000);
    row.appendChild(cb);
    const title = document.createElement("strong"); title.textContent=ev.eventName || "Event"; row.appendChild(title);
    const fee = document.createElement("span"); fee.textContent=` — ₹${(perPerson*state().participants.length).toLocaleString("en-IN")} total (₹${perPerson.toLocaleString("en-IN")} per person)`; row.appendChild(fee);
    list.appendChild(row);
    updateSelection();
  }

  function updateSelection() {
    const st = state();
    st.selectedEventIds = Array.from(document.querySelectorAll('#Group_EventList_ input[type="checkbox"]:checked')).map(cb=>cb.dataset.eventId);
    const summary = document.getElementById("Group_SelectionSummary_");
    const count = document.getElementById("Group_SelectionCount_");
    const total = document.getElementById("Group_SelectionTotal_");
    const proceed = document.getElementById("Group_ProceedToPaymentBtn_");
    const ev = st.events.find(e=>String(e.eventId)===String(st.selectedEventIds[0]));
    const amount = ev ? Number(ev.perPersonFee || 1000) * st.participants.length : 0;
    if (count) count.textContent = st.selectedEventIds.length ? "1 event selected" : "0 events selected";
    if (total) total.textContent = `Total: ₹${amount.toLocaleString("en-IN")}`;
    if (summary) summary.classList.toggle("hidden", !st.selectedEventIds.length);
    if (proceed) proceed.disabled = st.selectedEventIds.length !== 1;
  }

  async function createPaymentLink() {
    const st = state();
    if (!st.participants.length || st.selectedEventIds.length !== 1) { show("Please verify participants and select the event."); return; }
    const btn = document.getElementById("Group_ProceedToPaymentBtn_");
    if (btn) { btn.disabled=true; btn.textContent="Creating Payment Link..."; }
    try {
      const token = await ctx.auth.currentUser.getIdToken(true);
      const response = await fetch(ctx.APPS_SCRIPT_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"Group_CreatePaymentLink",idToken:token,mode:st.mode,participantIds:st.participants.map(p=>p.participantId),eventIds:st.selectedEventIds})});
      const text=await response.text(); const data=JSON.parse(text);
      if (!data.success) throw new Error(data.message || "Unable to create the payment link.");
      if (!data.paymentUrl) throw new Error("Payment URL was not returned.");
      window.location.href=data.paymentUrl;
    } catch(e) { console.error("Group_CreatePaymentLink:",e); show(e.message||"Unable to create payment link."); if(btn){btn.disabled=false;btn.textContent="💳 Proceed to Payment";} }
  }

  function backToMode() {
    reset();
    if (ctx.joinPanel) { ctx.joinPanel.classList.remove("hidden"); ctx.joinPanel.style.display=""; }
  }
  function show(msg){ try{ctx.showStatus(msg,"error");}catch(e){console.error(msg);} }
  function escapeHtml(v){ return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;", "'":"&#39;", '"':"&quot;"}[c])); }
  window.Group_Start_ = start;
  waitForContext();
})();
