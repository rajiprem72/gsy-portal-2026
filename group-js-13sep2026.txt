/* ============================================================
   Global School of Yoga — Consolidated Pair / Group Registration
   File: js/group.js

   Pair:
     - Add exactly 1 partner
     - Show 1 or 2 events from pair.json
     - Payment is the pair total fee

   Rhythmic:
     - Add exactly 4 participants
     - Total exactly 5
     - Show 1 event from rhythmic.json

   Artistic:
     - Add 5 to 11 participants
     - Total 6 to 12
     - Show 1 event from artistic.json

   Individual registration is NOT handled here.
============================================================ */
(function () {
  "use strict";

  let ctx = null;
  let initialized = false;
  let searchedParticipant = null;

  function Group_WaitForContext_() {
    if (window.GSYGroupContext) {
      ctx = window.GSYGroupContext;
      Group_Initialize_();
      return;
    }

    setTimeout(
      Group_WaitForContext_,
      100
    );
  }


  function Group_GetState_() {
    if (!window.GSYGroupState) {
      window.GSYGroupState = {
        mode: "",
        owner: null,
        participants: [],
        partner: null,
        events: [],
        selectedEventIds: []
      };
    }

    return window.GSYGroupState;
  }


  function Group_GetRules_(mode) {
    if (mode === "Pair") {
      return {
        mode: "Pair",
        minAdditional: 1,
        maxAdditional: 1,
        minTotal: 2,
        maxTotal: 2,
        file: "pair.json",
        eventCount: 2
      };
    }

    if (mode === "Rhythmic") {
      return {
        mode: "Rhythmic",
        minAdditional: 4,
        maxAdditional: 4,
        minTotal: 5,
        maxTotal: 5,
        file: "rhythmic.json",
        eventCount: 1
      };
    }

    return {
      mode: "Artistic",
      minAdditional: 5,
      maxAdditional: 11,
      minTotal: 6,
      maxTotal: 12,
      file: "artistic.json",
      eventCount: 1
    };
  }


  function Group_GetOwner_() {
    const idElement =
      document.getElementById("participantId");

    const nameElement =
      document.getElementById("participantName");

    const emailElement =
      document.getElementById("loginEmail");

    return {
      participantId:
        idElement
          ? String(idElement.textContent || "")
              .trim()
              .toUpperCase()
          : "",
      fullName:
        nameElement
          ? String(nameElement.textContent || "").trim()
          : "",
      email:
        emailElement
          ? String(emailElement.textContent || "").trim()
          : ""
    };
  }


  function Group_Initialize_() {
    if (initialized || !ctx) return;

    initialized = true;

    document
      .querySelectorAll(
        '.mode-card[data-mode="Pair"],' +
        '.mode-card[data-mode="Rhythmic"],' +
        '.mode-card[data-mode="Artistic"]'
      )
      .forEach(function (card) {
        card.addEventListener(
          "click",
          function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            Group_Start_(
              card.dataset.mode || ""
            );
          },
          true
        );
      });

    const pairFindButton =
      document.getElementById(
        "Pair_FindPartnerBtn_"
      );

    const pairSelectButton =
      document.getElementById(
        "Pair_SelectPartnerBtn_"
      );

    const pairChangeButton =
      document.getElementById(
        "Pair_ChangePartnerBtn_"
      );

    const pairProceedButton =
      document.getElementById(
        "Pair_ProceedToPaymentBtn_"
      );

    const pairBackButton =
      document.getElementById(
        "Pair_BackToModeBtn_"
      );

    const pairInput =
      document.getElementById(
        "Pair_PartnerParticipantId_"
      );

    const groupSearchButton =
      document.getElementById(
        "Group_VerifyBtn_"
      );

    const groupAddButton =
      document.getElementById(
        "Group_AddParticipantBtn_"
      );

    const groupProceedButton =
      document.getElementById(
        "Group_ProceedToPaymentBtn_"
      );

    const groupBackButton =
      document.getElementById(
        "Group_BackToModeBtn_"
      );

    const groupInput =
      document.getElementById(
        "Group_ParticipantInput_"
      );

    if (pairFindButton) {
      pairFindButton.addEventListener(
        "click",
        Group_SearchParticipant_
      );
    }

    if (pairSelectButton) {
      pairSelectButton.addEventListener(
        "click",
        Group_SelectPairPartner_
      );
    }

    if (pairChangeButton) {
      pairChangeButton.addEventListener(
        "click",
        Group_ChangePairPartner_
      );
    }

    if (pairProceedButton) {
      pairProceedButton.addEventListener(
        "click",
        Group_CreatePaymentLink_
      );
    }

    if (pairBackButton) {
      pairBackButton.addEventListener(
        "click",
        Group_BackToMode_
      );
    }

    if (pairInput) {
      pairInput.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            Group_SearchParticipant_();
          }
        }
      );
    }

    if (groupSearchButton) {
      groupSearchButton.addEventListener(
        "click",
        Group_SearchParticipant_
      );
    }

    if (groupAddButton) {
      groupAddButton.addEventListener(
        "click",
        Group_AddParticipant_
      );
    }

    if (groupProceedButton) {
      groupProceedButton.addEventListener(
        "click",
        Group_CreatePaymentLink_
      );
    }

    if (groupBackButton) {
      groupBackButton.addEventListener(
        "click",
        Group_BackToMode_
      );
    }

    if (groupInput) {
      groupInput.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            Group_SearchParticipant_();
          }
        }
      );
    }

    Group_Reset_();
  }


  function Group_Reset_() {
    searchedParticipant = null;

    window.GSYGroupState = {
      mode: "",
      owner: null,
      participants: [],
      partner: null,
      events: [],
      selectedEventIds: []
    };

    const pairPanel =
      document.getElementById("Pair_Panel_");

    const groupPanel =
      document.getElementById("Group_Panel_");

    const pairResult =
      document.getElementById("Pair_PartnerResult_");

    const pairEvents =
      document.getElementById("Pair_EventSection_");

    const groupEvents =
      document.getElementById("Group_EventSection_");

    if (pairPanel) {
      pairPanel.classList.add("hidden");
      pairPanel.style.display = "none";
    }

    if (groupPanel) {
      groupPanel.classList.add("hidden");
      groupPanel.style.display = "none";
    }

    if (pairResult) {
      pairResult.classList.add("hidden");
      pairResult.style.display = "none";
    }

    if (pairEvents) {
      pairEvents.classList.add("hidden");
      pairEvents.style.display = "none";
    }

    if (groupEvents) {
      groupEvents.classList.add("hidden");
      groupEvents.style.display = "none";
    }

    const pairEventList =
      document.getElementById("Pair_EventList_");

    const groupEventList =
      document.getElementById("Group_EventList_");

    if (pairEventList) pairEventList.innerHTML = "";
    if (groupEventList) groupEventList.innerHTML = "";

    Group_ResetButtons_();
  }


  function Group_ResetButtons_() {
    const ids = [
      "Pair_FindPartnerBtn_",
      "Pair_SelectPartnerBtn_",
      "Pair_ChangePartnerBtn_",
      "Pair_ProceedToPaymentBtn_",
      "Group_VerifyBtn_",
      "Group_AddParticipantBtn_",
      "Group_ProceedToPaymentBtn_"
    ];

    ids.forEach(function (id) {
      const button =
        document.getElementById(id);

      if (!button) return;

      button.disabled =
        id.indexOf("Proceed") !== -1;

      if (id === "Pair_FindPartnerBtn_") {
        button.textContent = "🔎 Find Partner";
      }

      if (id === "Pair_SelectPartnerBtn_") {
        button.textContent =
          "✅ Select This Participant as Partner";
      }

      if (id === "Pair_ChangePartnerBtn_") {
        button.textContent = "↔ Change Partner";
      }

      if (id === "Pair_ProceedToPaymentBtn_") {
        button.textContent =
          "💳 Proceed to Payment";
      }

      if (id === "Group_VerifyBtn_") {
        button.textContent =
          "🔎 Search Participant";
      }

      if (id === "Group_AddParticipantBtn_") {
        button.textContent =
          "✅ Add Participant";
      }

      if (id === "Group_ProceedToPaymentBtn_") {
        button.textContent =
          "💳 Proceed to Payment";
      }
    });
  }


  function Group_Start_(mode) {
    if (
      mode !== "Pair" &&
      mode !== "Rhythmic" &&
      mode !== "Artistic"
    ) {
      return;
    }

    Group_Reset_();

    const state =
      Group_GetState_();

    state.mode = mode;
    state.owner = Group_GetOwner_();

    if (!state.owner.participantId) {
      Group_ShowError_(
        "Unable to read your Participant ID. Please refresh the dashboard."
      );
      return;
    }

    if (ctx.joinPanel) {
      ctx.joinPanel.classList.add("hidden");
      ctx.joinPanel.style.display = "none";
    }

    if (ctx.cataloguePanel) {
      ctx.cataloguePanel.classList.add("hidden");
      ctx.cataloguePanel.style.display = "none";
    }

    if (mode === "Pair") {
      const panel =
        document.getElementById("Pair_Panel_");

      if (panel) {
        panel.classList.remove("hidden");
        panel.style.display = "block";
      }

      const input =
        document.getElementById(
          "Pair_PartnerParticipantId_"
        );

      if (input) {
        setTimeout(
          function () {
            input.focus();
          },
          100
        );
      }

      return;
    }

    const panel =
      document.getElementById("Group_Panel_");

    const title =
      document.getElementById("Group_Title_");

    const subtitle =
      document.getElementById("Group_Subtitle_");

    const help =
      document.getElementById("Group_ModeHelp_");

    const input =
      document.getElementById(
        "Group_ParticipantInput_"
      );

    const rules =
      Group_GetRules_(mode);

    if (panel) {
      panel.classList.remove("hidden");
      panel.style.display = "block";
    }

    if (title) {
      title.textContent =
        rules.mode +
        " Group Registration";
    }

    if (subtitle) {
      subtitle.textContent =
        mode === "Rhythmic"
          ? "Enter 4 additional Participant IDs, one at a time."
          : "Enter 5 to 11 additional Participant IDs, one at a time.";
    }

    if (help) {
      help.textContent =
        mode === "Rhythmic"
          ? "You are Participant 1. Exactly 5 participants are required."
          : "You are Participant 1. Add a minimum of 5 participants and up to 11 additional participants.";
    }

    Group_RenderParticipants_();
    Group_UpdateProgress_();

    if (input) {
      setTimeout(
        function () {
          input.focus();
        },
        100
      );
    }
  }


  async function Group_SearchParticipant_() {
    const state =
      Group_GetState_();

    if (!state.mode) return;

    const isPair =
      state.mode === "Pair";

    const input =
      document.getElementById(
        isPair
          ? "Pair_PartnerParticipantId_"
          : "Group_ParticipantInput_"
      );

    const searchButton =
      document.getElementById(
        isPair
          ? "Pair_FindPartnerBtn_"
          : "Group_VerifyBtn_"
      );

    const result =
      document.getElementById(
        isPair
          ? "Pair_PartnerResult_"
          : "Group_SearchResult_"
      );

    const participantId =
      input
        ? String(input.value || "")
            .trim()
            .toUpperCase()
        : "";

    if (!participantId) {
      Group_ShowError_(
        "Please enter the Participant ID."
      );
      return;
    }

    const rules =
      Group_GetRules_(state.mode);

    if (
      !isPair &&
      state.participants.length >=
        rules.maxAdditional
    ) {
      Group_ShowError_(
        "The maximum group size has been reached."
      );
      return;
    }

    if (
      participantId ===
      String(
        state.owner.participantId || ""
      ).toUpperCase()
    ) {
      Group_ShowError_(
        "You cannot add yourself."
      );
      return;
    }

    if (
      state.participants.some(function (p) {
        return (
          String(p.participantId || "")
            .toUpperCase() ===
          participantId
        );
      })
    ) {
      Group_ShowError_(
        "This participant has already been added."
      );
      return;
    }

    if (searchButton) {
      searchButton.disabled = true;
      searchButton.textContent =
        "Searching...";
    }

    if (result) {
      result.classList.add("hidden");
      result.style.display = "none";
    }

    try {
      if (
        !ctx.auth ||
        !ctx.auth.currentUser
      ) {
        throw new Error(
          "Please sign in again."
        );
      }

      const idToken =
        await ctx.auth.currentUser.getIdToken(true);

      const response =
        await fetch(
          ctx.APPS_SCRIPT_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },
            body:
              JSON.stringify({
                action:
                  "Group_FindParticipant",
                idToken:
                  idToken,
                participantId:
                  participantId
              })
          }
        );

      const responseText =
        await response.text();

      console.log(
        "GROUP SEARCH HTTP:",
        response.status
      );

      console.log(
        "GROUP SEARCH RESPONSE:",
        responseText
      );

      let data;

      try {
        data =
          JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(
          "The participant service returned an invalid response."
        );
      }

      if (!data.success || !data.partner) {
        throw new Error(
          data.message ||
          "Participant not found."
        );
      }

      searchedParticipant =
        data.partner;

      if (isPair) {
        const idDisplay =
          document.getElementById(
            "Pair_PartnerIdDisplay_"
          );

        const nameDisplay =
          document.getElementById(
            "Pair_PartnerNameDisplay_"
          );

        const fatherDisplay =
          document.getElementById(
            "Pair_PartnerFatherNameDisplay_"
          );

        if (idDisplay) {
          idDisplay.textContent =
            data.partner.participantId ||
            participantId;
        }

        if (nameDisplay) {
          nameDisplay.textContent =
            data.partner.fullName || "";
        }

        if (fatherDisplay) {
          fatherDisplay.textContent =
            data.partner.fatherName || "";
        }

        if (result) {
          result.classList.remove("hidden");
          result.style.display = "block";
        }

        Group_ShowSuccess_(
          "Partner found. Please select this participant as your partner."
        );
      } else {
        const idDisplay =
          document.getElementById(
            "Group_SearchResultId_"
          );

        const nameDisplay =
          document.getElementById(
            "Group_SearchResultName_"
          );

        const fatherDisplay =
          document.getElementById(
            "Group_SearchResultFather_"
          );

        if (idDisplay) {
          idDisplay.textContent =
            data.partner.participantId ||
            participantId;
        }

        if (nameDisplay) {
          nameDisplay.textContent =
            data.partner.fullName || "";
        }

        if (fatherDisplay) {
          fatherDisplay.textContent =
            data.partner.fatherName || "";
        }

        if (result) {
          result.classList.remove("hidden");
          result.style.display = "block";
        }

        Group_ShowSuccess_(
          "Participant found. Please add this participant to the group."
        );
      }
    } catch (error) {
      console.error(
        "GROUP PARTICIPANT SEARCH ERROR:",
        error
      );

      searchedParticipant = null;

      if (result) {
        result.classList.add("hidden");
        result.style.display = "none";
      }

      Group_ShowError_(
        error.message ||
        "Unable to find the participant."
      );
    } finally {
      if (searchButton) {
        searchButton.disabled = false;
        searchButton.textContent =
          isPair
            ? "🔎 Find Partner"
            : "🔎 Search Participant";
      }
    }
  }


  function Group_SelectPairPartner_() {
    const state =
      Group_GetState_();

    if (
      state.mode !== "Pair" ||
      !searchedParticipant
    ) {
      Group_ShowError_(
        "Please search for a Partner first."
      );
      return;
    }

    state.partner =
      searchedParticipant;

    state.participants = [
      searchedParticipant
    ];

    searchedParticipant = null;

    const input =
      document.getElementById(
        "Pair_PartnerParticipantId_"
      );

    const result =
      document.getElementById(
        "Pair_PartnerResult_"
      );

    if (input) {
      input.value = "";
    }

    if (result) {
      result.classList.add("hidden");
      result.style.display = "none";
    }

    const eventSection =
      document.getElementById(
        "Pair_EventSection_"
      );

    if (eventSection) {
      eventSection.classList.remove("hidden");
      eventSection.style.display = "block";
    }

    Group_LoadEvents_().catch(function (error) {
      console.error(
        "GROUP PAIR LOAD EVENTS ERROR:",
        error
      );

      Group_ShowError_(
        error.message ||
        "Unable to load Pair events."
      );
    });

    Group_UpdateProgress_();
  }


  function Group_ChangePairPartner_() {
    const state =
      Group_GetState_();

    if (state.mode !== "Pair") return;

    state.partner = null;
    state.participants = [];
    state.events = [];
    state.selectedEventIds = [];

    searchedParticipant = null;

    const eventSection =
      document.getElementById(
        "Pair_EventSection_"
      );

    if (eventSection) {
      eventSection.classList.add("hidden");
      eventSection.style.display = "none";
    }

    const result =
      document.getElementById(
        "Pair_PartnerResult_"
      );

    if (result) {
      result.classList.add("hidden");
      result.style.display = "none";
    }

    const input =
      document.getElementById(
        "Pair_PartnerParticipantId_"
      );

    if (input) {
      input.value = "";
      input.focus();
    }

    Group_UpdatePairSelection_();
  }


  function Group_AddParticipant_() {
    const state =
      Group_GetState_();

    if (
      state.mode !== "Rhythmic" &&
      state.mode !== "Artistic"
    ) {
      return;
    }

    if (!searchedParticipant) {
      Group_ShowError_(
        "Please search for a participant first."
      );
      return;
    }

    const rules =
      Group_GetRules_(state.mode);

    if (
      state.participants.length >=
      rules.maxAdditional
    ) {
      Group_ShowError_(
        "The maximum group size has been reached."
      );
      return;
    }

    const id =
      String(
        searchedParticipant.participantId || ""
      )
        .trim()
        .toUpperCase();

    if (!id) {
      Group_ShowError_(
        "The participant ID could not be read."
      );
      return;
    }

    if (
      state.participants.some(function (p) {
        return (
          String(p.participantId || "")
            .trim()
            .toUpperCase() === id
        );
      })
    ) {
      Group_ShowError_(
        "This participant has already been added."
      );
      return;
    }

    state.participants.push({
      participantId: id,
      fullName:
        searchedParticipant.fullName || "",
      fatherName:
        searchedParticipant.fatherName || ""
    });

    searchedParticipant = null;

    const input =
      document.getElementById(
        "Group_ParticipantInput_"
      );

    const result =
      document.getElementById(
        "Group_SearchResult_"
      );

    if (input) input.value = "";

    if (result) {
      result.classList.add("hidden");
      result.style.display = "none";
    }

    Group_RenderParticipants_();
    Group_UpdateProgress_();

    if (
      state.participants.length >=
      rules.minAdditional
    ) {
      Group_LoadEvents_().catch(function (error) {
        console.error(
          "GROUP LOAD EVENTS ERROR:",
          error
        );

        Group_ShowError_(
          error.message ||
          "Unable to load group event."
        );
      });
    }

    if (
      state.participants.length <
        rules.maxAdditional &&
      input
    ) {
      setTimeout(
        function () {
          input.focus();
        },
        50
      );
    }
  }


  function Group_RemoveParticipant_(participantId) {
    const state =
      Group_GetState_();

    state.participants =
      state.participants.filter(function (p) {
        return (
          String(p.participantId)
            .toUpperCase() !==
          String(participantId)
            .toUpperCase()
        );
      });

    state.events = [];
    state.selectedEventIds = [];

    const section =
      document.getElementById(
        "Group_EventSection_"
      );

    if (section) {
      section.classList.add("hidden");
      section.style.display = "none";
    }

    Group_RenderParticipants_();
    Group_UpdateProgress_();
  }


  function Group_RenderParticipants_() {
    const state =
      Group_GetState_();

    const target =
      document.getElementById(
        "Group_ParticipantList_"
      );

    const verified =
      document.getElementById(
        "Group_VerifiedParticipants_"
      );

    if (!target) return;

    let html = "";

    const owner =
      state.owner || {};

    if (owner.participantId) {
      html +=
        '<div style="padding:10px 12px;border:1px solid #d9e8d9;border-radius:8px;margin-bottom:8px;background:#f6fbf6;">' +
        '<strong>Participant 1 — You</strong><br>' +
        Group_EscapeHtml_(
          owner.participantId
        ) +
        (
          owner.fullName
            ? " — " +
              Group_EscapeHtml_(
                owner.fullName
              )
            : ""
        ) +
        "</div>";
    }

    state.participants.forEach(function(p, index) {
      html +=
        '<div style="padding:10px 12px;border:1px solid #d9e8d9;border-radius:8px;margin-bottom:8px;background:#f6fbf6;display:flex;justify-content:space-between;gap:10px;align-items:center;">' +
        '<div><strong>Participant ' +
        String(index + 2) +
        "</strong><br>" +
        Group_EscapeHtml_(
          p.participantId
        ) +
        (
          p.fullName
            ? " — " +
              Group_EscapeHtml_(
                p.fullName
              )
            : ""
        ) +
        "</div>" +
        '<button type="button" data-remove-group-participant="' +
        Group_EscapeHtml_(
          p.participantId
        ) +
        '" class="back-mode-btn" style="margin:0;padding:6px 10px;">Remove</button>' +
        "</div>";
    });

    target.innerHTML = html;

    target
      .querySelectorAll(
        "[data-remove-group-participant]"
      )
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            Group_RemoveParticipant_(
              button.getAttribute(
                "data-remove-group-participant"
              )
            );
          }
        );
      });

    if (verified) {
      verified.textContent =
        state.participants.length > 0
          ? state.participants.length +
            " additional participant(s) verified."
          : "";
    }
  }


  function Group_UpdateProgress_() {
    const state =
      Group_GetState_();

    if (!state.mode) return;

    const rules =
      Group_GetRules_(
        state.mode
      );

    const progress =
      document.getElementById(
        "Group_ParticipantProgress_"
      );

    if (state.mode === "Pair") {
      if (progress) {
        progress.textContent =
          state.participants.length >= 1
            ? "2 participants ready — select your Pair event(s)."
            : "Add exactly 1 Partner.";
      }

      return;
    }

    const total =
      state.participants.length + 1;

    if (progress) {
      progress.textContent =
        state.mode === "Rhythmic"
          ? "Participants added: " +
            total +
            " / 5. Four additional participants are mandatory."
          : "Participants added: " +
            total +
            " / 12. Minimum 6 participants; you may continue up to 12.";
    }

    const input =
      document.getElementById(
        "Group_ParticipantInput_"
      );

    const searchButton =
      document.getElementById(
        "Group_VerifyBtn_"
      );

    if (
      state.participants.length >=
      rules.maxAdditional
    ) {
      if (input) input.disabled = true;

      if (searchButton) {
        searchButton.disabled = true;
        searchButton.textContent =
          "Maximum Reached";
      }
    } else {
      if (input) input.disabled = false;

      if (searchButton) {
        searchButton.disabled = false;
        searchButton.textContent =
          "🔎 Search Participant";
      }
    }
  }


  async function Group_LoadEvents_() {
    const state =
      Group_GetState_();

    if (!state.mode) return;

    const rules =
      Group_GetRules_(
        state.mode
      );

    const participantCount =
      state.participants.length +
      1;

    if (
      state.mode === "Pair" &&
      participantCount !== 2
    ) {
      return;
    }

    if (
      state.mode !== "Pair" &&
      (
        participantCount <
          rules.minTotal ||
        participantCount >
          rules.maxTotal
      )
    ) {
      return;
    }

    const response =
      await fetch(
        "data/" + rules.file,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Unable to load " +
        rules.file +
        "."
      );
    }

    const catalogue =
      await response.json();

    if (
      !catalogue ||
      !Array.isArray(
        catalogue.events
      )
    ) {
      throw new Error(
        "The " +
        rules.file +
        " catalogue is invalid."
      );
    }

    if (
      catalogue.events.length !==
      rules.eventCount
    ) {
      throw new Error(
        "The " +
        rules.file +
        " catalogue must contain exactly " +
        rules.eventCount +
        " event" +
        (rules.eventCount === 1 ? "" : "s") +
        "."
      );
    }

    state.events =
      catalogue.events;

    if (state.mode === "Pair") {
      const section =
        document.getElementById(
          "Pair_EventSection_"
        );

      const message =
        document.getElementById(
          "Pair_EventMessage_"
        );

      if (section) {
        section.classList.remove("hidden");
        section.style.display = "block";
      }

      if (message) {
        message.textContent =
          catalogue.selectionMessage ||
          "Select one or both Pair events.";
      }

      Group_RenderPairEvents_();
      return;
    }

    const section =
      document.getElementById(
        "Group_EventSection_"
      );

    const message =
      document.getElementById(
        "Group_EventMessage_"
      );

    if (section) {
      section.classList.remove("hidden");
      section.style.display = "block";
    }

    if (message) {
      message.textContent =
        catalogue.selectionMessage ||
        "Select the group event.";
    }

    Group_RenderGroupEvents_();
  }


  function Group_RenderPairEvents_() {
    const state =
      Group_GetState_();

    const list =
      document.getElementById(
        "Pair_EventList_"
      );

    if (!list) return;

    list.innerHTML = "";

    state.events.forEach(function(event) {
      const row =
        document.createElement("label");

      row.style.display = "block";
      row.style.padding = "12px";
      row.style.marginBottom = "10px";
      row.style.border = "1px solid #ddd";
      row.style.borderRadius = "8px";
      row.style.cursor = "pointer";

      const checkbox =
        document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.dataset.eventId =
        event.eventId || "";
      checkbox.style.marginRight = "10px";

      checkbox.addEventListener(
        "change",
        Group_UpdatePairSelection_
      );

      const title =
        document.createElement("strong");

      title.textContent =
        event.eventName || "Event";

      const fee =
        document.createElement("div");

      fee.style.marginTop = "6px";

      fee.textContent =
        "₹" +
        Number(
          event.fee !== undefined
            ? event.fee
            : event.perPersonFee || 0
        ).toLocaleString("en-IN") +
        " total for the pair";

      row.appendChild(checkbox);
      row.appendChild(title);
      row.appendChild(fee);
      list.appendChild(row);
    });

    Group_UpdatePairSelection_();
  }


  function Group_UpdatePairSelection_() {
    const state =
      Group_GetState_();

    const checked =
      Array.from(
        document.querySelectorAll(
          "#Pair_EventList_ input[type='checkbox']:checked"
        )
      );

    state.selectedEventIds =
      checked.map(function(checkbox) {
        return checkbox.dataset.eventId;
      });

    const summary =
      document.getElementById(
        "Pair_SelectionSummary_"
      );

    const count =
      document.getElementById(
        "Pair_SelectionCount_"
      );

    const total =
      document.getElementById(
        "Pair_SelectionTotal_"
      );

    const proceed =
      document.getElementById(
        "Pair_ProceedToPaymentBtn_"
      );

    let amount = 0;

    checked.forEach(function(checkbox) {
      const event =
        state.events.find(function(item) {
          return (
            String(item.eventId) ===
            String(checkbox.dataset.eventId)
          );
        });

      if (event) {
        amount +=
          Number(
            event.fee !== undefined
              ? event.fee
              : event.perPersonFee || 0
          );
      }
    });

    if (count) {
      count.textContent =
        state.selectedEventIds.length === 1
          ? "1 event selected"
          : state.selectedEventIds.length +
            " events selected";
    }

    if (total) {
      total.textContent =
        "Total: ₹" +
        amount.toLocaleString("en-IN");
    }

    if (summary) {
      summary.classList.toggle(
        "hidden",
        state.selectedEventIds.length === 0
      );

      summary.style.display =
        state.selectedEventIds.length === 0
          ? "none"
          : "block";
    }

    if (proceed) {
      proceed.disabled =
        state.selectedEventIds.length === 0 ||
        state.participants.length !== 1;
    }
  }


  function Group_RenderGroupEvents_() {
    const state =
      Group_GetState_();

    const list =
      document.getElementById(
        "Group_EventList_"
      );

    if (!list) return;

    list.innerHTML = "";

    state.events.forEach(function(event) {
      const row =
        document.createElement("label");

      row.style.display = "block";
      row.style.padding = "12px";
      row.style.marginBottom = "10px";
      row.style.border = "1px solid #ddd";
      row.style.borderRadius = "8px";
      row.style.cursor = "pointer";

      const checkbox =
        document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.dataset.eventId =
        event.eventId || "";
      checkbox.style.marginRight = "10px";

      checkbox.addEventListener(
        "change",
        Group_UpdateGroupSelection_
      );

      const perPerson =
        Number(
          event.perPersonFee !== undefined
            ? event.perPersonFee
            : event.fee || 0
        );

      const total =
        perPerson *
        (state.participants.length + 1);

      const title =
        document.createElement("strong");

      title.textContent =
        event.eventName || "Event";

      const fee =
        document.createElement("div");

      fee.style.marginTop = "6px";

      fee.textContent =
        "₹" +
        total.toLocaleString("en-IN") +
        " total (₹" +
        perPerson.toLocaleString("en-IN") +
        " per person)";

      row.appendChild(checkbox);
      row.appendChild(title);
      row.appendChild(fee);
      list.appendChild(row);
    });

    Group_UpdateGroupSelection_();
  }


  function Group_UpdateGroupSelection_() {
    const state =
      Group_GetState_();

    const checked =
      Array.from(
        document.querySelectorAll(
          "#Group_EventList_ input[type='checkbox']:checked"
        )
      );

    state.selectedEventIds =
      checked.map(function(checkbox) {
        return checkbox.dataset.eventId;
      });

    const summary =
      document.getElementById(
        "Group_SelectionSummary_"
      );

    const count =
      document.getElementById(
        "Group_SelectionCount_"
      );

    const total =
      document.getElementById(
        "Group_SelectionTotal_"
      );

    const proceed =
      document.getElementById(
        "Group_ProceedToPaymentBtn_"
      );

    const event =
      state.events.find(function(item) {
        return (
          String(item.eventId) ===
          String(state.selectedEventIds[0])
        );
      });

    const participantCount =
      state.participants.length + 1;

    const amount =
      event
        ? Number(
            event.perPersonFee !== undefined
              ? event.perPersonFee
              : event.fee || 0
          ) *
          participantCount
        : 0;

    if (count) {
      count.textContent =
        state.selectedEventIds.length === 1
          ? "1 event selected"
          : state.selectedEventIds.length +
            " events selected";
    }

    if (total) {
      total.textContent =
        "Total: ₹" +
        amount.toLocaleString("en-IN");
    }

    if (summary) {
      summary.classList.toggle(
        "hidden",
        state.selectedEventIds.length !== 1
      );

      summary.style.display =
        state.selectedEventIds.length !== 1
          ? "none"
          : "block";
    }

    if (proceed) {
      proceed.disabled =
        state.selectedEventIds.length !== 1;
    }
  }


  async function Group_CreatePaymentLink_() {
    const state =
      Group_GetState_();

    if (
      !state.mode ||
      !state.owner ||
      !state.owner.participantId
    ) {
      Group_ShowError_(
        "Unable to identify your participant account."
      );
      return;
    }

    const rules =
      Group_GetRules_(
        state.mode
      );

    const totalParticipants =
      state.participants.length + 1;

    if (
      totalParticipants <
        rules.minTotal ||
      totalParticipants >
        rules.maxTotal
    ) {
      Group_ShowError_(
        "Please add the required number of participants before proceeding to payment."
      );
      return;
    }

    if (
      !state.selectedEventIds ||
      state.selectedEventIds.length < 1 ||
      state.selectedEventIds.length >
        rules.eventCount
    ) {
      Group_ShowError_(
        "Please select the event(s) before proceeding."
      );
      return;
    }

    const button =
      document.getElementById(
        state.mode === "Pair"
          ? "Pair_ProceedToPaymentBtn_"
          : "Group_ProceedToPaymentBtn_"
      );

    if (button) {
      button.disabled = true;
      button.textContent =
        "Creating Payment Link...";
    }

    try {
      if (
        !ctx.auth ||
        !ctx.auth.currentUser
      ) {
        throw new Error(
          "Please sign in again."
        );
      }

      const token =
        await ctx.auth.currentUser.getIdToken(true);

      const participantIds = [
        state.owner.participantId
      ].concat(
        state.participants.map(function(p) {
          return p.participantId;
        })
      );

      const response =
        await fetch(
          ctx.APPS_SCRIPT_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },
            body:
              JSON.stringify({
                action:
                  "Group_CreatePaymentLink",
                idToken:
                  token,
                mode:
                  state.mode,
                participantIds:
                  participantIds,
                eventIds:
                  state.selectedEventIds
              })
          }
        );

      const responseText =
        await response.text();

      console.log(
        "GROUP PAYMENT HTTP:",
        response.status
      );

      console.log(
        "GROUP PAYMENT RESPONSE:",
        responseText
      );

      let data;

      try {
        data =
          JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(
          "The payment service returned an invalid response."
        );
      }

      if (!data.success) {
        throw new Error(
          data.message ||
          "Unable to create the payment link."
        );
      }

      if (!data.paymentUrl) {
        throw new Error(
          "Payment URL was not returned."
        );
      }

      Group_ShowSuccess_(
        "Payment link created. Redirecting to Razorpay..."
      );

      setTimeout(
        function () {
          window.location.href =
            data.paymentUrl;
        },
        700
      );
    } catch (error) {
      console.error(
        "GROUP PAYMENT ERROR:",
        error
      );

      Group_ShowError_(
        error.message ||
        "Unable to create the payment link."
      );

      if (button) {
        button.disabled = false;
        button.textContent =
          "💳 Proceed to Payment";
      }
    }
  }


  function Group_BackToMode_() {
    Group_Reset_();

    if (ctx.joinPanel) {
      ctx.joinPanel.classList.remove("hidden");
      ctx.joinPanel.style.display = "";
    }

    if (ctx.cataloguePanel) {
      ctx.cataloguePanel.classList.add("hidden");
    }

    if (ctx.joinAnotherEventBtn) {
      ctx.joinAnotherEventBtn.textContent =
        "➕ Join Another Event";
    }
  }


  function Group_ShowError_(message) {
    try {
      ctx.showStatus(
        message,
        "error"
      );
    } catch (error) {
      console.error(message);
    }
  }


  function Group_ShowSuccess_(message) {
    try {
      ctx.showStatus(
        message,
        "success"
      );
    } catch (error) {
      console.log(message);
    }
  }


  function Group_EscapeHtml_(value) {
    return String(
      value == null ? "" : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  window.Group_Start_ =
    Group_Start_;

  window.Group_Reset_ =
    Group_Reset_;

  window.Group_SearchParticipant_ =
    Group_SearchParticipant_;

  window.Group_CreatePaymentLink_ =
    Group_CreatePaymentLink_;

  Group_WaitForContext_();
})();
