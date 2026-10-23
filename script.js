
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

// Lock form controls while a submission is processing or after success.
function setFormLocked(form, locked) {
  form.querySelectorAll("input, select, textarea, button").forEach((control) => {
    control.disabled = locked;
  });
  form.setAttribute("aria-busy", String(locked));
}

// Contact form: send enquiries through the backend email service
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  let contactSubmitted = false;
  let contactSending = false;
  const detailsInput = document.getElementById("details");

  // Clear a previous word-count error as the user edits the enquiry.
  if (detailsInput) {
    detailsInput.addEventListener("input", () => detailsInput.setCustomValidity(""));
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (contactSubmitted || contactSending) return;

    if (detailsInput) detailsInput.setCustomValidity("");
    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const detailsText = String(formData.get("details") || "").trim();
    const wordCount = detailsText.split(/\s+/).filter(Boolean).length;
    if (wordCount < 20) {
      detailsInput.setCustomValidity("Please describe your project in at least 20 words.");
      detailsInput.reportValidity();
      return;
    }
    detailsInput.setCustomValidity("");

    const fullName = String(formData.get("name") || "").trim().replace(/\s+/g, " ");
    if (!/^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$/.test(fullName)) {
      const nameInput = document.getElementById("name");
      nameInput.setCustomValidity("Please enter your first and last name.");
      nameInput.reportValidity();
      return;
    }
    document.getElementById("name").setCustomValidity("");

    const payload = {
      name: fullName,
      email: String(formData.get("email") || "").trim(),
      project: String(formData.get("project") || "").trim(),
      details: detailsText,
    };

    const status = document.getElementById("contact-status");
    const submitButton = contactForm.querySelector('button[type="submit"]');
    status.style.display = "block";
    status.textContent = "Sending your enquiry... Please wait.";
    contactSending = true;
    setFormLocked(contactForm, true);

    try {
      const response = await fetch("https://lori-s-timeline.onrender.com/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to send your enquiry.");

      status.textContent = "Your enquiry has been sent successfully. Thank you for contacting Lori's Timeline.";
      contactSubmitted = true;
      contactForm.reset();
    } catch (error) {
      status.textContent = error.message === "Failed to fetch"
        ? "We couldn't connect to the enquiry service. Please try again shortly or email loristimeline@gmail.com directly."
        : error.message || "We couldn't send your enquiry. Please try again.";
    } finally {
      contactSending = false;
      if (!contactSubmitted) setFormLocked(contactForm, false);
    }
  });
}

// Mentorship registration and simulated checkout
const registrationForm = document.getElementById("registration-form");
const checkout = document.getElementById("payment-checkout");

if (registrationForm && checkout) {
  const phoneInput = document.getElementById("phone");
  const countrySelect = document.getElementById("country-code");
  const phoneHelp = document.getElementById("phone-help");
  const emailInput = document.getElementById("remail");
  const confirmEmailInput = document.getElementById("confirm-email");
  const status = document.getElementById("reg-status");
  const submitButton = registrationForm.querySelector('button[type="submit"]');

  const referenceElement = document.getElementById("payment-reference");
  const resultBox = document.getElementById("payment-result");
  const resultTitle = document.getElementById("payment-result-title");
  const resultMessage = document.getElementById("payment-result-message");

  let registrationId = null;
  let registrationSending = false;
  let paymentInProgress = false;

  function getExpectedPhoneLength() {
    return Number(countrySelect.selectedOptions[0].dataset.length);
  }

  function syncPhoneLengthLimit() {
    const expectedLength = getExpectedPhoneLength();
    phoneInput.maxLength = expectedLength;
    phoneInput.placeholder = `Enter ${expectedLength} digits`;
    phoneHelp.textContent = `Enter exactly ${expectedLength} digits for the selected country.`;
  }

  function validatePhone() {
    const phone = phoneInput.value;
    const expectedLength = getExpectedPhoneLength();

    if (!/^\d+$/.test(phone)) {
      phoneInput.setCustomValidity("Only numbers allowed.");
      phoneHelp.textContent = "Only numbers allowed.";
      return false;
    }

    if (phone.length !== expectedLength) {
      const message =
        `Enter exactly ${expectedLength} digits for the selected country.`;

      phoneInput.setCustomValidity(message);
      phoneHelp.textContent = message;
      return false;
    }

    phoneInput.setCustomValidity("");
    phoneHelp.textContent =
      `Enter exactly ${expectedLength} digits for the selected country.`;

    return true;
  }

  function validateEmails() {
    const email = emailInput.value.trim().toLowerCase();
    const confirmation = confirmEmailInput.value.trim().toLowerCase();

    if (email !== confirmation) {
      confirmEmailInput.setCustomValidity(
        "Email addresses do not match."
      );
      return false;
    }

    confirmEmailInput.setCustomValidity("");
    return true;
  }

  syncPhoneLengthLimit();

  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, getExpectedPhoneLength());
    validatePhone();
  });

  countrySelect.addEventListener("change", () => {
    phoneInput.value = "";
    syncPhoneLengthLimit();
    validatePhone();
  });

  emailInput.addEventListener("input", validateEmails);
  confirmEmailInput.addEventListener("input", validateEmails);

  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (registrationSending || registrationId) return;

    if (!registrationForm.reportValidity()) return;

    if (!validatePhone() || !validateEmails()) {
      registrationForm.reportValidity();
      return;
    }

    const formData = new FormData(registrationForm);

    const fullName = String(formData.get("name") || "").trim().replace(/\s+/g, " ");
    if (!/^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$/.test(fullName)) {
      const nameInput = document.getElementById("rname");
      nameInput.setCustomValidity("Please enter your first and last name.");
      nameInput.reportValidity();
      return;
    }
    document.getElementById("rname").setCustomValidity("");

    const data = {
      name: fullName,
      email: String(formData.get("email") || "").trim(),
      confirmEmail: String(formData.get("confirmEmail") || "").trim(),
      countryCode: String(formData.get("countryCode") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      goal: String(formData.get("goal") || "").trim(),
    };

    status.style.display = "block";
    status.textContent = "Saving your registration... Please wait.";
    registrationSending = true;
    setFormLocked(registrationForm, true);

    try {
      const response = await fetch(
        "https://lori-s-timeline.onrender.com/api/registrations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

   const contentType = response.headers.get("content-type") || "";
   const result = contentType.includes("application/json")
     ? await response.json()
     : { message: "The registration server returned an unexpected response. Please try again later." };

console.log("Registration API response:", response.status, result);

if (!response.ok) {
  throw new Error(result.message || "Registration failed.");
}

registrationId = result.registrationId;

if (!registrationId || !result.paymentReference) {
  throw new Error(
    result.message ||
    "Missing registration ID or payment reference. Check the backend response in the console."
  );
}

      referenceElement.textContent = result.paymentReference;
      resultBox.hidden = true;
      checkout.hidden = false;
      registrationForm.closest("section").hidden = true;

      checkout.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      registrationSending = false;
      setFormLocked(registrationForm, false);
      status.textContent =
        error.message === "Failed to fetch"
          ? "Could not connect to the server. Make sure your backend is running."
          : error.message || "Something went wrong. Please try again.";
    } finally {
      if (!registrationId) {
        registrationSending = false;
        setFormLocked(registrationForm, false);
      }
    }
  });

  // Local-only demo simulation. It never calls the backend or changes enrolment status.
  let demoPaymentFinished = false;
  const demoButtons = [
    document.getElementById("simulate-success"),
    document.getElementById("simulate-failure"),
    document.getElementById("simulate-abandon"),
  ];

  function showDemoPayment(outcome) {
    if (demoPaymentFinished) return;
    const resultBox = document.getElementById("payment-result");
    const resultTitle = document.getElementById("payment-result-title");
    const resultMessage = document.getElementById("payment-result-message");
    resultBox.hidden = false;

    if (outcome === "success") {
      resultTitle.textContent = "Demo payment successful";
      resultMessage.textContent = "This is only a simulation. No money was charged, no email was sent, and your registration is still pending until real payment is verified.";
      demoPaymentFinished = true;
    } else if (outcome === "failed") {
      resultTitle.textContent = "Demo payment failed";
      resultMessage.textContent = "This is only a simulation. No money was charged and your registration remains pending. You can try the demo again.";
    } else {
      resultTitle.textContent = "Demo checkout closed";
      resultMessage.textContent = "Checkout was abandoned in this simulation. No money was charged and your registration remains pending.";
      demoPaymentFinished = true;
    }

    demoButtons.forEach((button) => {
      button.disabled = demoPaymentFinished;
    });
  }

  document.getElementById("simulate-success").addEventListener("click", () => showDemoPayment("success"));
  document.getElementById("simulate-failure").addEventListener("click", () => showDemoPayment("failed"));
  document.getElementById("simulate-abandon").addEventListener("click", () => showDemoPayment("abandoned"));

  document.getElementById("start-over").addEventListener("click", () => {
    checkout.hidden = true;
    registrationForm.closest("section").hidden = false;
    registrationForm.reset();
    setFormLocked(registrationForm, false);
    registrationSending = false;

    registrationId = null;
    demoPaymentFinished = false;
    demoButtons.forEach((button) => { button.disabled = false; });
    document.getElementById("payment-result").hidden = true;
    status.textContent = "";
    status.style.display = "none";

    phoneHelp.textContent = "Only numbers allowed.";
    phoneInput.placeholder = "Enter numbers only";

    checkout.scrollIntoView({ behavior: "smooth" });
  });
}
