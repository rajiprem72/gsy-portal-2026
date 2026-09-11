/* ============================================================
   Global School of Yoga — Rhythmic / Artistic Group Registration
   File: js/group.js

   Flow:
   Rhythmic  = add 4 additional participants (total 5)
   Artistic  = add 5 to 11 additional participants (total 6 to 12)
   Each participant is searched individually and added to the group.
   Only after the minimum group size is reached is the event shown.
   ============================================================ */
(function () {
  "use strict";

  let ctx = null;
  let initialized = false;
  let searchedParticipant = null;

  function waitForContext() {
    if (window.GSYGroupContext) {
      ctx = window.GSYGroupContext;
      initialize();
      return;
    }
    setTimeout(waitForContext, 100);
  }

  function initialize() {
    if (initialized || !ctx) return;
    initialized = true;

    document
      .querySelectorAll('.mode-card[data-mode="Rhythmic"], .mode-card[data-mode="Artistic"]')
      .forEach(function (card) {
        card.addEventListener(
          "click",
          function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            start(card.dataset.mode || "");
          },
          true
        );
      });

    const searchBtn = document.getElementById("Group_VerifyBtn_");
    const addBtn = document.getElementById("Group_AddParticipantBtn_");
    const input = document.getElementById("Group_ParticipantInput_");
    const proceedBtn = document.getElementById("Group_ProceedToPaymentBtn_");
    const backBtn = document.getElementById("Group_BackToModeBtn_");

    if (searchBtn) searchBtn.addEventListener("click", searchParticipant);
    if (addBtn) addBtn.addEventListener("click", addSearchedParticipant);
    if (proceedBtn) proceedBtn.addEventListener("click", createPaymentLink);
    if (backBtn) backBtn.addEventListener("click", backToMode);

    if (input) {
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          searchParticipant();
        }
      });
    }

    reset();
  }

  function getState() {
    if (!window.GSYGroupState) {
      window.GSYGroupState = {
        mode: "",
        owner: null,
        participants: [],
        events: [],
        selectedEventIds: []
      };
    }
    return window.GSYGroupState;
  }

  function getRules(mode) {
    if (mode === "Rhythmic") {
      return {
        minAdditional: 4,
        maxAdditional: 4,
        minTotal: 5,
        maxTotal: 5,
        title: "Rhythmic Group Registration",
        file: "rhythmic.json"
      };
    }

    return {
      minAdditional: 5,
      maxAdditional: 11,
      minTotal: 6,
      maxTotal: 12,
      title: "Artistic Group Registration",
      file: "artistic.json"
    };
  }

  function getOwnerFromDashboard() {
    const participantId = document.getElementById("participantId");
    const participantName = document.getElementById("participantName");
    const loginEmail = document.getElementById("loginEmail");

    const id = participantId
      ? String(participantId.textContent || "").trim().toUpperCase()
      : "";
    const name = participantName
      ? String(participantName.textContent || "").trim()
      : "";
    const email = loginEmail
      ? String(loginEmail.textContent || "").trim()
      : "";

    return {
      participantId: id,
      fullName: name,
      email: email
    };
  }

  function reset() {
    searchedParticipant = null;

    window.GSYGroupState = {
      mode: "",
      owner: null,
      participants: [],
      events: [],
      selectedEventIds: []
    };

    const panel = document.getElementById("Group_Panel_");
    const section = document.getElementById("Group_EventSection_");
    const input = document.getElementById("Group_ParticipantInput_");
    const result = document.getElementById("Group_SearchResult_");
    const list = document.getElementById("Group_ParticipantList_");
    const verified = document.getElementById("Group_VerifiedParticipants_");
    const progress = document.getElementById("Group_ParticipantProgress_");
    const events = document.getElementById("Group_EventList_");
    const message = document.getElementById("Group_EventMessage_");
    const summary = document.getElementById("Group_SelectionSummary_");
    const count = document.getElementById("Group_SelectionCount_");
    const total = document.getElementById("Group_SelectionTotal_");
    const searchBtn = document.getElementById("Group_VerifyBtn_");
    const addBtn = document.getElementById("Group_AddParticipantBtn_");
    const proceedBtn = document.getElementById("Group_ProceedToPaymentBtn_");

    if (panel) {
      panel.classList.add("hidden");
      panel.style.display = "";
    }

    if (section) {
      section.classList.add("hidden");
      section.style.display = "none";
    }

    if (input) input.value = "";
    if (result) result.classList.add("hidden");
    if (list) list.innerHTML = "";
    if (verified) verified.textContent = "";
    if (progress) progress.textContent = "";
    if (events) events.innerHTML = "";
    if (message) message.textContent = "";
    if (summary) summary.classList.add("hidden");
    if (count) count.textContent = "0 events selected";
    if (total) total.textContent = "Total: ₹0";
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.textContent = "🔎 Search Participant";
    }
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.textContent = "✅ Add Participant";
    }
    if (proceedBtn) {
      proceedBtn.disabled = true;
      proceedBtn.textContent = "💳 Proceed to Payment";
    }
  }

  function start(mode) {
    if (mode !== "Rhythmic" && mode !== "Artistic") return;

    reset();

    const rules = getRules(mode);
    const owner = getOwnerFromDashboard();
    const st = getState();
    st.mode = mode;
    st.owner = owner;

    const panel = document.getElementById("Group_Panel_");
    const title = document.getElementById("Group_Title_");
    const subtitle = document.getElementById("Group_Subtitle_");
    const help = document.getElementById("Group_ModeHelp_");
    const input = document.getElementById("Group_ParticipantInput_");

    if (panel) {
      panel.classList.remove("hidden");
      panel.style.display = "block";
    }

    if (ctx.cataloguePanel) ctx.cataloguePanel.classList.add("hidden");
    if (ctx.joinPanel) ctx.joinPanel.classList.add("hidden");

    if (title) title.textContent = rules.title;
    if (subtitle) {
      subtitle.textContent =
        mode === "Rhythmic"
          ? "Enter the 4 additional Participant IDs, one at a time."
          : "Enter 5 to 11 additional Participant IDs, one at a time.";
    }
    if (help) {
      help.textContent =
        "You are Participant 1. Your group will contain " +
        rules.minTotal +
        (rules.maxTotal !== rules.minTotal ? " to " + rules.maxTotal : "") +
        " participants in total.";
    }

    renderParticipantList();
    updateProgress();

    if (input) {
      setTimeout(function () {
        input.focus();
      }, 100);
    }
  }

  async function searchParticipant() {
    const st = getState();
    if (!st.mode) return;

    const rules = getRules(st.mode);
    if (st.participants.length >= rules.maxAdditional) {
      showError("The maximum group size has been reached.");
      return;
    }

    const input = document.getElementById("Group_ParticipantInput_");
    const searchBtn = document.getElementById("Group_VerifyBtn_");
    const result = document.getElementById("Group_SearchResult_");

    const participantId = input
      ? String(input.value || "").trim().toUpperCase()
      : "";

    if (!participantId) {
      showError("Please enter the Participant ID.");
      return;
    }

    if (participantId === String(st.owner.participantId || "").toUpperCase()) {
      showError("You cannot add yourself as another group participant.");
      return;
    }

    if (st.participants.some(function (p) {
      return String(p.participantId || "").toUpperCase() === participantId;
    })) {
      showError("This participant has already been added to the group.");
      return;
    }

    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.textContent = "Searching...";
    }
    if (result) result.classList.add("hidden");

    try {
      if (!ctx.auth || !ctx.auth.currentUser) {
        throw new Error("Please sign in again.");
      }

      const idToken = await ctx.auth.currentUser.getIdToken(true);

      const response = await fetch(ctx.APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "Pair_FindPartner",
          idToken: idToken,
          partnerParticipantId: participantId
        })
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("GROUP SEARCH RAW RESPONSE:", text);
        throw new Error("The participant service returned an invalid response.");
      }

      if (!data.success || !data.partner) {
        throw new Error(data.message || "Participant not found.");
      }

      searchedParticipant = data.partner;

      const idDisplay = document.getElementById("Group_SearchResultId_");
      const nameDisplay = document.getElementById("Group_SearchResultName_");
      const fatherDisplay = document.getElementById("Group_SearchResultFather_");

      if (idDisplay) idDisplay.textContent = data.partner.participantId || participantId;
      if (nameDisplay) nameDisplay.textContent = data.partner.fullName || "";
      if (fatherDisplay) fatherDisplay.textContent = data.partner.fatherName || "";
      if (result) result.classList.remove("hidden");

      showSuccess("Participant found. Please add this participant to the group.");
    } catch (error) {
      console.error("Group participant search error:", error);
      searchedParticipant = null;
      showError(error.message || "Unable to find the participant.");
    } finally {
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.textContent = "🔎 Search Participant";
      }
    }
  }

  function addSearchedParticipant() {
    const st = getState();
    const rules = getRules(st.mode);
    const input = document.getElementById("Group_ParticipantInput_");
    const result = document.getElementById("Group_SearchResult_");

    if (!searchedParticipant) {
      showError("Please search for a participant first.");
      return;
    }

    if (st.participants.length >= rules.maxAdditional) {
      showError("The maximum group size has been reached.");
      return;
    }

    const id = String(searchedParticipant.participantId || "").trim().toUpperCase();
    if (!id) {
      showError("The participant ID could not be read.");
      return;
    }

    if (st.participants.some(function (p) {
      return String(p.participantId || "").trim().toUpperCase() === id;
    })) {
      showError("This participant has already been added.");
      return;
    }

    st.participants.push({
      participantId: id,
      fullName: searchedParticipant.fullName || "",
      fatherName: searchedParticipant.fatherName || ""
    });

    searchedParticipant = null;

    if (input) input.value = "";
    if (result) result.classList.add("hidden");

    renderParticipantList();
    updateProgress();

    if (st.participants.length >= rules.minAdditional) {
      loadEvents().catch(function (error) {
        console.error("Group_LoadEvents:", error);
        showError(error.message || "Unable to load group event.");
      });
    }

    if (st.participants.length < rules.maxAdditional && input) {
      setTimeout(function () {
        input.focus();
      }, 50);
    }
  }

  function removeParticipant(participantId) {
    const st = getState();
    st.participants = st.participants.filter(function (p) {
      return String(p.participantId).toUpperCase() !== String(participantId).toUpperCase();
    });

    renderParticipantList();
    updateProgress();

    const rules = getRules(st.mode);
    if (st.participants.length < rules.minAdditional) {
      const section = document.getElementById("Group_EventSection_");
      if (section) {
        section.classList.add("hidden");
        section.style.display = "none";
      }
      st.events = [];
      st.selectedEventIds = [];
      updateSelection();
    } else {
      updateSelection();
    }
  }

  function renderParticipantList() {
    const st = getState();
    const target = document.getElementById("Group_ParticipantList_");
    const verified = document.getElementById("Group_VerifiedParticipants_");

    if (!target) return;

    let html = "";

    const owner = st.owner || {};
    if (owner.participantId) {
      html +=
        '<div style="padding:10px 12px;border:1px solid #d9e8d9;border-radius:8px;margin-bottom:8px;background:#f6fbf6;">' +
        '<strong>Participant 1 — You</strong><br>' +
        escapeHtml(owner.participantId) +
        (owner.fullName ? " — " + escapeHtml(owner.fullName) : "") +
        "</div>";
    }

    st.participants.forEach(function (p, index) {
      html +=
        '<div style="padding:10px 12px;border:1px solid #d9e8d9;border-radius:8px;margin-bottom:8px;background:#f6fbf6;display:flex;justify-content:space-between;gap:10px;align-items:center;">' +
        '<div><strong>Participant ' +
        String(index + 2) +
        "</strong><br>" +
        escapeHtml(p.participantId) +
        (p.fullName ? " — " + escapeHtml(p.fullName) : "") +
        "</div>" +
        '<button type="button" data-remove-group-participant="' +
        escapeHtml(p.participantId) +
        '" class="back-mode-btn" style="margin:0;padding:6px 10px;">Remove</button>' +
        "</div>";
    });

    target.innerHTML = html;

    target.querySelectorAll("[data-remove-group-participant]").forEach(function (button) {
      button.addEventListener("click", function () {
        removeParticipant(button.getAttribute("data-remove-group-participant"));
      });
    });

    if (verified) {
      verified.textContent =
        st.participants.length > 0
          ? st.participants.length + " additional participant(s) verified."
          : "";
    }
  }

  function updateProgress() {
    const st = getState();
    if (!st.mode) return;

    const rules = getRules(st.mode);
    const progress = document.getElementById("Group_ParticipantProgress_");
    const input = document.getElementById("Group_ParticipantInput_");
    const searchBtn = document.getElementById("Group_VerifyBtn_");

    const added = st.participants.length;
    const total = added + 1;

    if (progress) {
      if (st.mode === "Rhythmic") {
        progress.textContent =
          "Participants added: " + total + " / 5. Four additional participants are mandatory.";
      } else {
        progress.textContent =
          "Participants added: " + total + " / 12. Minimum 6 participants; you may continue up to 12.";
      }
    }

    if (added >= rules.maxAdditional) {
      if (input) input.disabled = true;
      if (searchBtn) searchBtn.disabled = true;
      if (searchBtn) searchBtn.textContent = "Maximum Reached";
    } else {
      if (input) input.disabled = false;
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.textContent = "🔎 Search Participant";
      }
    }
  }

  async function loadEvents() {
    const st = getState();
    const rules = getRules(st.mode);

    if (st.participants.length < rules.minAdditional) return;

    const response = await fetch("data/" + rules.file, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Unable to load " + rules.file + ".");
    }

    const catalogue = await response.json();

    if (!catalogue || !Array.isArray(catalogue.events) || catalogue.events.length !== 1) {
      throw new Error("The " + st.mode + " catalogue must contain exactly one event.");
    }

    st.events = catalogue.events;

    const section = document.getElementById("Group_EventSection_");
    const message = document.getElementById("Group_EventMessage_");

    if (section) {
      section.classList.remove("hidden");
      section.style.display = "block";
    }

    if (message) {
      message.textContent =
        catalogue.selectionMessage ||
        "Select the event you would like to join.";
    }

    renderEvents();
    showSuccess("Your group is ready. Please select the event to continue.");
  }

  function renderEvents() {
    const st = getState();
    const list = document.getElementById("Group_EventList_");
    if (!list) return;

    list.innerHTML = "";

    st.events.forEach(function (event) {
      const row = document.createElement("label");
      row.style.display = "block";
      row.style.padding = "12px";
      row.style.marginBottom = "10px";
      row.style.border = "1px solid #ddd";
      row.style.borderRadius = "8px";
      row.style.cursor = "pointer";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.eventId = event.eventId || "";
      checkbox.style.marginRight = "10px";
      checkbox.addEventListener("change", updateSelection);

      const perPerson = Number(event.perPersonFee || 1000);
      const total = perPerson * (st.participants.length + 1);

      const title = document.createElement("strong");
      title.textContent = event.eventName || "Event";

      const fee = document.createElement("div");
      fee.style.marginTop = "6px";
      fee.textContent =
        "₹" + total.toLocaleString("en-IN") +
        " total (₹" + perPerson.toLocaleString("en-IN") + " per person)";

      row.appendChild(checkbox);
      row.appendChild(title);
      row.appendChild(fee);
      list.appendChild(row);
    });

    updateSelection();
  }

  function updateSelection() {
    const st = getState();
    const checked = Array.from(
      document.querySelectorAll("#Group_EventList_ input[type='checkbox']:checked")
    );

    st.selectedEventIds = checked.map(function (checkbox) {
      return checkbox.dataset.eventId;
    });

    const summary = document.getElementById("Group_SelectionSummary_");
    const count = document.getElementById("Group_SelectionCount_");
    const total = document.getElementById("Group_SelectionTotal_");
    const proceed = document.getElementById("Group_ProceedToPaymentBtn_");

    const event = st.events.find(function (item) {
      return String(item.eventId) === String(st.selectedEventIds[0]);
    });

    const participantsCount = (st.participants || []).length + 1;
    const amount = event
      ? Number(event.perPersonFee || 1000) * participantsCount
      : 0;

    if (count) {
      count.textContent = st.selectedEventIds.length + " event selected";
    }

    if (total) {
      total.textContent = "Total: ₹" + amount.toLocaleString("en-IN");
    }

    if (summary) {
      summary.classList.toggle("hidden", st.selectedEventIds.length !== 1);
    }

    if (proceed) {
      proceed.disabled = st.selectedEventIds.length !== 1;
    }
  }

  async function createPaymentLink() {
    const st = getState();
    const rules = getRules(st.mode);
    const totalParticipants = (st.participants || []).length + 1;

    if (totalParticipants < rules.minTotal || totalParticipants > rules.maxTotal) {
      showError(
        "Please add the required number of participants before proceeding to payment."
      );
      return;
    }

    if (!st.selectedEventIds || st.selectedEventIds.length !== 1) {
      showError("Please select the group event.");
      return;
    }

    const button = document.getElementById("Group_ProceedToPaymentBtn_");
    if (button) {
      button.disabled = true;
      button.textContent = "Creating Payment Link...";
    }

    try {
      const token = await ctx.auth.currentUser.getIdToken(true);
      const participantIds = [
        st.owner.participantId
      ].concat(st.participants.map(function (p) {
        return p.participantId;
      }));

      const response = await fetch(ctx.APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "Group_CreatePaymentLink",
          idToken: token,
          mode: st.mode,
          participantIds: participantIds,
          eventIds: st.selectedEventIds
        })
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("GROUP PAYMENT RAW RESPONSE:", text);
        throw new Error("The payment service returned an invalid response.");
      }

      if (!data.success) {
        throw new Error(data.message || "Unable to create the payment link.");
      }

      if (!data.paymentUrl) {
        throw new Error("Payment URL was not returned.");
      }

      window.location.href = data.paymentUrl;
    } catch (error) {
      console.error("Group_CreatePaymentLink:", error);
      showError(error.message || "Unable to create the payment link.");
      if (button) {
        button.disabled = false;
        button.textContent = "💳 Proceed to Payment";
      }
    }
  }

  function backToMode() {
    reset();
    if (ctx.joinPanel) {
      ctx.joinPanel.classList.remove("hidden");
      ctx.joinPanel.style.display = "";
    }
  }

  function showError(message) {
    try {
      ctx.showStatus(message, "error");
    } catch (error) {
      console.error(message);
    }
  }

  function showSuccess(message) {
    try {
      ctx.showStatus(message, "success");
    } catch (error) {
      console.log(message);
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.Group_Start_ = start;
  window.Group_Reset_ = reset;

  waitForContext();
})();
