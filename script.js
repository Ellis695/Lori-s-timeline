
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
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (contactSubmitted || contactSending) return;

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const detailsText = String(formData.get("details") || "").trim();
    const wordCount = detailsText.split(/\\s+/).filter(Boolean).length;
    const detailsInput = document.getElementById("details");
    if (wordCount < 20) {
      detailsInput.setCustomValidity("Please describe your project in at least 20 words.");
      detailsInput.reportValidity();
      return;
    }
    detailsInput.setCustomValidity("");

    const payload = {
      name: String(formData.get("name") || "").trim(),
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

  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "");
    validatePhone();
  });

  countrySelect.addEventListener("change", () => {
    phoneInput.value = "";
    phoneInput.placeholder = `Enter ${getExpectedPhoneLength()} digits`;
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

    const data = {
      name: String(formData.get("name") || "").trim(),
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

   const result = await response.json();

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

  async function simulatePayment(outcome) {
    if (!registrationId || paymentInProgress) return;

    paymentInProgress = true;

    const buttons = [
      document.getElementById("simulate-success"),
      document.getElementById("simulate-failure"),
      document.getElementById("simulate-abandon"),
    ];

    buttons.forEach((button) => {
      button.disabled = true;
    });

    resultBox.hidden = false;
    resultTitle.textContent = "Processing...";
    resultMessage.textContent = "Please wait.";

    try {
      const response = await fetch(
        `https://lori-s-timeline.onrender.com/api/registrations/${encodeURIComponent(registrationId)}/simulate-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outcome }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Payment simulation failed.");
      }

      if (outcome === "success") {
        resultTitle.textContent = "Payment confirmed";
        resultMessage.textContent =
          "You're enrolled for the February 2027 cohort. A confirmation email and onboarding details are on the way.";
      } else if (outcome === "failed") {
        resultTitle.textContent = "Payment failed";
        resultMessage.textContent =
          "You have not been enrolled. Please try again.";
      } else {
        resultTitle.textContent = "Checkout not completed";
        resultMessage.textContent =
          "Your place isn't reserved yet. You can resume payment any time.";
      }

      if (result.emailSent === false && outcome === "success") {
        resultMessage.textContent +=
          " However, the confirmation email could not be sent. Please check the server logs.";
      }
    } catch (error) {
      resultTitle.textContent = "Something went wrong";
      resultMessage.textContent = error.message;
    } finally {
      paymentInProgress = false;

      // Prevent repeated outcome clicks after the server records a result.
      if (resultTitle.textContent !== "Something went wrong") {
        buttons.forEach((button) => { button.disabled = true; });
      } else {
        buttons.forEach((button) => { button.disabled = false; });
      }
    }
  }

  document.getElementById("simulate-success").addEventListener("click", () => {
    simulatePayment("success");
  });

  document.getElementById("simulate-failure").addEventListener("click", () => {
    simulatePayment("failed");
  });

  document.getElementById("simulate-abandon").addEventListener("click", () => {
    simulatePayment("abandoned");
  });

  document.getElementById("start-over").addEventListener("click", () => {
    checkout.hidden = true;
    registrationForm.closest("section").hidden = false;
    registrationForm.reset();
    setFormLocked(registrationForm, false);
    registrationSending = false;

    registrationId = null;
    status.textContent = "";
    status.style.display = "none";

    phoneHelp.textContent = "Only numbers allowed.";
    phoneInput.placeholder = "Enter numbers only";

    checkout.scrollIntoView({ behavior: "smooth" });
  });
}
