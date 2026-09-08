/* ============================================================
   pair.js
   Global School of Yoga — Pair Event Registration
   ============================================================ */

(function () {
  "use strict";

  let ctx = null;
  let initialized = false;

  function Pair_WaitForContext_() {
    if (window.GSYPairContext) {
      ctx = window.GSYPairContext;
      Pair_Initialize_();
      return;
    }

    setTimeout(Pair_WaitForContext_, 100);
  }

  function Pair_Initialize_() {
    if (initialized || !ctx) return;
    initialized = true;

    const partnerInput =
      document.getElementById("Pair_PartnerParticipantId_");
    const findPartnerBtn =
      document.getElementById("Pair_FindPartnerBtn_");
    const selectPartnerBtn =
      document.getElementById("Pair_SelectPartnerBtn_");
    const changePartnerBtn =
      document.getElementById("Pair_ChangePartnerBtn_");
    const proceedBtn =
      document.getElementById("Pair_ProceedToPaymentBtn_");
    const backBtn =
      document.getElementById("Pair_BackToModeBtn_");

    if (findPartnerBtn) {
      findPartnerBtn.addEventListener("click", Pair_FindPartner_);
    }

    if (selectPartnerBtn) {
      selectPartnerBtn.addEventListener("click", Pair_SelectPartner_);
    }

    if (changePartnerBtn) {
      changePartnerBtn.addEventListener("click", Pair_ChangePartner_);
    }

    if (proceedBtn) {
      proceedBtn.addEventListener("click", Pair_CreatePaymentLink_);
    }

    if (backBtn) {
      backBtn.addEventListener("click", Pair_BackToMode_);
    }

    if (partnerInput) {
      partnerInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          Pair_FindPartner_();
        }
      });
    }

    /*
      Pair mode click is handled by this module because profile.html
      intentionally skips Pair in its generic mode handler.
    */
    const pairModeCard =
      document.querySelector('.mode-card[data-mode="Pair"]');

    if (pairModeCard) {
      pairModeCard.addEventListener(
        "click",
        function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          Pair_Start_();
        },
        true
      );
    }

    Pair_Reset_();
  }

  function Pair_Reset_() {
    const panel = document.getElementById("Pair_Panel_");
    const partnerInput =
      document.getElementById("Pair_PartnerParticipantId_");

    const partnerResult =
      document.getElementById("Pair_PartnerResult_");

    const eventSection =
      document.getElementById("Pair_EventSection_");

    const eventList =
      document.getElementById("Pair_EventList_");

    const eventMessage =
      document.getElementById("Pair_EventMessage_");

    const summary =
      document.getElementById("Pair_SelectionSummary_");

    const count =
      document.getElementById("Pair_SelectionCount_");

    const total =
      document.getElementById("Pair_SelectionTotal_");

    if (partnerInput) {
      partnerInput.value = "";
    }

    if (partnerResult) {
      partnerResult.style.display = "none";
    }

    if (eventSection) {
      eventSection.classList.add("hidden");
      eventSection.style.display = "none";
    }

    if (eventList) {
      eventList.innerHTML = "";
    }

    if (eventMessage) {
      eventMessage.textContent = "";
    }

    if (summary) {
      summary.style.display = "none";
    }

    if (count) {
      count.textContent = "0";
    }

    if (total) {
      total.textContent = "₹0";
    }

    if (panel) {
      panel.classList.add("hidden");
      panel.style.display = "";
    }

    window.GSYPairState = {
      partner: null,
      events: [],
      selectedEventIds: []
    };
  }

  async function Pair_Start_() {
    const panel = document.getElementById("Pair_Panel_");
    const cataloguePanel = ctx.cataloguePanel;

    Pair_Reset_();

    if (panel) {
      panel.classList.remove("hidden");
      panel.style.display = "";
    }

    if (cataloguePanel) {
      cataloguePanel.classList.add("hidden");
      cataloguePanel.style.display = "";
    }

    const partnerInput =
      document.getElementById("Pair_PartnerParticipantId_");

    if (partnerInput) {
      setTimeout(function () {
        partnerInput.focus();
      }, 100);
    }
  }

  async function Pair_FindPartner_() {
    const partnerInput =
      document.getElementById("Pair_PartnerParticipantId_");

    const partnerId =
      partnerInput
        ? partnerInput.value.trim().toUpperCase()
        : "";

    if (!partnerId) {
      Pair_ShowStatus_("Please enter the Partner Participant ID.");
      return;
    }

    if (!ctx || !ctx.auth || !ctx.auth.currentUser) {
      Pair_ShowStatus_("Please sign in again.");
      return;
    }

    const findBtn =
      document.getElementById("Pair_FindPartnerBtn_");

    if (findBtn) {
      findBtn.disabled = true;
      findBtn.textContent = "Searching...";
    }

    try {
      const idToken =
        await ctx.auth.currentUser.getIdToken(true);

      const response = await fetch(
        ctx.APPS_SCRIPT_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify({
            action: "Pair_FindPartner",
            idToken: idToken,
            partnerParticipantId: partnerId
          })
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Partner Participant ID not found."
        );
      }

      const partner = data.data || data.partner;

      if (!partner) {
        throw new Error("Partner details were not returned.");
      }

      window.GSYPairState.partner = partner;

      const result =
        document.getElementById("Pair_PartnerResult_");

      const idDisplay =
        document.getElementById("Pair_PartnerIdDisplay_");

      const nameDisplay =
        document.getElementById("Pair_PartnerNameDisplay_");

      const fatherDisplay =
        document.getElementById("Pair_PartnerFatherNameDisplay_");

      if (idDisplay) {
        idDisplay.textContent =
          partner.participantId ||
          partner.Participant_ID ||
          partner.id ||
          partnerId;
      }

      if (nameDisplay) {
        nameDisplay.textContent =
          partner.fullName ||
          partner.Full_Name ||
          partner.name ||
          "";
      }

      if (fatherDisplay) {
        fatherDisplay.textContent =
          partner.fatherName ||
          partner.Father_Name ||
          "";
      }

      if (result) {
        result.style.display = "block";
      }

      Pair_ShowStatus_("Partner found successfully.");

    } catch (error) {
      console.error("Pair_FindPartner_:", error);

      const result =
        document.getElementById("Pair_PartnerResult_");

      if (result) {
        result.style.display = "none";
      }

      Pair_ShowStatus_(
        error.message ||
        "Unable to find the partner."
      );

    } finally {
      if (findBtn) {
        findBtn.disabled = false;
        findBtn.textContent = "Find Partner";
      }
    }
  }

  async function Pair_SelectPartner_() {
    if (!window.GSYPairState ||
        !window.GSYPairState.partner) {
      Pair_ShowStatus_("Please search for a partner first.");
      return;
    }

    const partner =
      window.GSYPairState.partner;

    const eventSection =
      document.getElementById("Pair_EventSection_");

    if (eventSection) {
      eventSection.classList.remove("hidden");
      eventSection.style.display = "block";
    }

    await Pair_LoadEvents_();
  }

  function Pair_ChangePartner_() {
    const eventSection =
      document.getElementById("Pair_EventSection_");

    const partnerResult =
      document.getElementById("Pair_PartnerResult_");

    const partnerInput =
      document.getElementById("Pair_PartnerParticipantId_");

    if (eventSection) {
      eventSection.style.display = "none";
    }

    if (partnerResult) {
      partnerResult.style.display = "none";
    }

    if (partnerInput) {
      partnerInput.focus();
    }

    window.GSYPairState.partner = null;
    window.GSYPairState.events = [];
    window.GSYPairState.selectedEventIds = [];

    Pair_UpdateSelection_();
  }

  async function Pair_LoadEvents_() {
    const eventMessage =
      document.getElementById("Pair_EventMessage_");

    const eventList =
      document.getElementById("Pair_EventList_");

    if (eventMessage) {
      eventMessage.textContent = "Loading Pair events...";
    }

    if (eventList) {
      eventList.innerHTML = "";
    }

    try {
      const response = await fetch(
        "data/pair.json",
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load Pair event catalogue."
        );
      }

      const catalogue = await response.json();

      if (!catalogue ||
          catalogue.mode !== "Pair" ||
          !Array.isArray(catalogue.events)) {
        throw new Error(
          "Invalid Pair event catalogue."
        );
      }

      if (catalogue.events.length !== 2) {
        throw new Error(
          "Pair catalogue must contain exactly 2 events."
        );
      }

      for (const event of catalogue.events) {
        if (!event.eventId ||
            !event.eventName ||
            Number(event.fee) !== 2000) {
          throw new Error(
            "Invalid Pair event configuration."
          );
        }

        if (Number(event.participants) !== 2) {
          throw new Error(
            "Pair event must contain exactly 2 participants."
          );
        }
      }

      window.GSYPairState.events =
        catalogue.events;

      Pair_RenderEvents_();

      if (eventMessage) {
        eventMessage.textContent =
          catalogue.selectionMessage ||
          "Select one or both Pair events.";
      }

    } catch (error) {
      console.error("Pair_LoadEvents_:", error);

      if (eventMessage) {
        eventMessage.textContent =
          error.message ||
          "Unable to load Pair events.";
      }

      Pair_ShowStatus_(
        error.message ||
        "Unable to load Pair events."
      );
    }
  }

  function Pair_RenderEvents_() {
    const eventList =
      document.getElementById("Pair_EventList_");

    if (!eventList) return;

    eventList.innerHTML = "";

    const events =
      window.GSYPairState.events || [];

    events.forEach(function (event) {
      const wrapper =
        document.createElement("label");

      wrapper.style.display = "block";
      wrapper.style.marginBottom = "12px";
      wrapper.style.padding = "12px";
      wrapper.style.border = "1px solid #ddd";
      wrapper.style.borderRadius = "8px";
      wrapper.style.cursor = "pointer";

      const checkbox =
        document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.dataset.eventId =
        event.eventId;

      checkbox.style.marginRight = "10px";

      checkbox.addEventListener(
        "change",
        Pair_UpdateSelection_
      );

      const title =
        document.createElement("strong");

      title.textContent =
        event.eventName;

      const fee =
        document.createElement("span");

      fee.textContent =
        " — ₹" +
        Number(event.fee).toLocaleString("en-IN") +
        " total (₹" +
        Number(
          event.perPersonFee || 1000
        ).toLocaleString("en-IN") +
        " per person)";

      wrapper.appendChild(checkbox);
      wrapper.appendChild(title);
      wrapper.appendChild(fee);

      eventList.appendChild(wrapper);
    });

    Pair_UpdateSelection_();
  }

  function Pair_UpdateSelection_() {
    const eventList =
      document.getElementById("Pair_EventList_");

    const summary =
      document.getElementById("Pair_SelectionSummary_");

    const count =
      document.getElementById("Pair_SelectionCount_");

    const total =
      document.getElementById("Pair_SelectionTotal_");

    const proceedBtn =
      document.getElementById("Pair_ProceedToPaymentBtn_");

    if (!eventList) return;

    const checked =
      Array.from(
        eventList.querySelectorAll(
          'input[type="checkbox"]:checked'
        )
      );

    const selectedIds =
      checked.map(function (checkbox) {
        return checkbox.dataset.eventId;
      });

    window.GSYPairState.selectedEventIds =
      selectedIds;

    let selectedTotal = 0;

    selectedIds.forEach(function (eventId) {
      const event =
        (window.GSYPairState.events || [])
          .find(function (item) {
            return item.eventId === eventId;
          });

      if (event) {
        selectedTotal +=
          Number(event.fee || 0);
      }
    });

    if (count) {
      count.textContent =
        String(selectedIds.length);
    }

    if (total) {
      total.textContent =
        "₹" +
        selectedTotal.toLocaleString("en-IN");
    }

    if (summary) {
      summary.style.display =
        selectedIds.length > 0
          ? "block"
          : "none";
    }

    if (proceedBtn) {
      proceedBtn.disabled =
        selectedIds.length === 0;
    }
  }

  async function Pair_CreatePaymentLink_() {
    const state =
      window.GSYPairState;

    if (!state ||
        !state.partner) {
      Pair_ShowStatus_(
        "Please select a partner first."
      );
      return;
    }

    if (!Array.isArray(state.selectedEventIds) ||
        state.selectedEventIds.length < 1 ||
        state.selectedEventIds.length > 2) {
      Pair_ShowStatus_(
        "Please select one or two Pair events."
      );
      return;
    }

    if (!ctx ||
        !ctx.auth ||
        !ctx.auth.currentUser) {
      Pair_ShowStatus_("Please sign in again.");
      return;
    }

    const proceedBtn =
      document.getElementById(
        "Pair_ProceedToPaymentBtn_"
      );

    if (proceedBtn) {
      proceedBtn.disabled = true;
      proceedBtn.textContent =
        "Creating Payment Link...";
    }

    try {
      const idToken =
        await ctx.auth.currentUser.getIdToken(true);

      const response = await fetch(
        ctx.APPS_SCRIPT_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify({
            action: "Pair_CreatePaymentLink",
            idToken: idToken,
            partnerParticipantId:
              state.partner.participantId ||
              state.partner.Participant_ID,
            eventIds:
              state.selectedEventIds
          })
        }
      );

      const data =
        await response.json();

      if (!data.success) {
        throw new Error(
          data.message ||
          "Unable to create the payment link."
        );
      }

      const paymentUrl =
        data.paymentUrl ||
        (data.data && data.data.paymentUrl);

      if (!paymentUrl) {
        throw new Error(
          "Payment URL was not returned."
        );
      }

      window.location.href =
        paymentUrl;

    } catch (error) {
      console.error(
        "Pair_CreatePaymentLink_:",
        error
      );

      Pair_ShowStatus_(
        error.message ||
        "Unable to create the payment link."
      );

      if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.textContent =
          "Proceed to Payment";
      }
    }
  }

  function Pair_BackToMode_() {
    const panel =
      document.getElementById("Pair_Panel_");

    if (panel) {
      panel.classList.add("hidden");
      panel.style.display = "";
    }

    if (ctx && ctx.joinPanel) {
      ctx.joinPanel.classList.remove("hidden");
      ctx.joinPanel.style.display = "";
    }

    Pair_Reset_();
  }

  function Pair_ShowStatus_(message) {
    try {
      if (ctx && typeof ctx.showStatus === "function") {
        ctx.showStatus(message);
      } else {
        console.log(message);
      }
    } catch (error) {
      console.error(
        "Pair_ShowStatus_:",
        error
      );
    }
  }

  window.Pair_Reset_ = Pair_Reset_;
  window.Pair_Start_ = Pair_Start_;
  window.Pair_FindPartner_ = Pair_FindPartner_;
  window.Pair_SelectPartner_ = Pair_SelectPartner_;
  window.Pair_ChangePartner_ = Pair_ChangePartner_;
  window.Pair_LoadEvents_ = Pair_LoadEvents_;
  window.Pair_RenderEvents_ = Pair_RenderEvents_;
  window.Pair_UpdateSelection_ = Pair_UpdateSelection_;
  window.Pair_CreatePaymentLink_ =
    Pair_CreatePaymentLink_;
  window.Pair_BackToMode_ = Pair_BackToMode_;

  Pair_WaitForContext_();

})();
