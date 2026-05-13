/**
 * White Banger Database Integration
 * Using Firebase Cloud Firestore to save form submissions automatically.
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Firebase Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBgeZ8Ve28P2JJo5LH0WDHOlYNG90tudSM",
  authDomain: "whitebangerorg-8b462.firebaseapp.com",
  projectId: "whitebangerorg-8b462",
  storageBucket: "whitebangerorg-8b462.firebasestorage.app",
  messagingSenderId: "1021731763445",
  appId: "1:1021731763445:web:a87ccc79cf60eb1a5e81bc",
  measurementId: "G-BLW27XSK0X"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Universal Form Submitter
 * Saves form data to a specific Firestore collection
 * @param {HTMLFormElement} formElement - The form being submitted
 * @param {string} collectionName - The Firestore collection to save to (e.g., "contacts", "admissions")
 * @param {Event} event - The submit event (to prevent default behavior)
 */
export async function submitFormToDatabase(formElement, collectionName, event) {
  event.preventDefault(); // Stop normal HTML submission

  // Get data from form
  const formData = new FormData(formElement);
  const dataObject = {};
  
  formData.forEach((value, key) => {
    dataObject[key] = value;
  });

  // Custom logic for the Inquiry Modal Form tabs ("Self" vs "By Staff")
  if (formElement.id === 'wbInquiryForm') {
    const activeTab = formElement.querySelector('.wb-form-tab.active');
    if (activeTab) {
      dataObject['enquiryType'] = activeTab.textContent.trim();
    }
  }

  // Track submission metadata
  dataObject.submittedAt = serverTimestamp();
  dataObject.pageUrl = window.location.href;

  const submitButton = formElement.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit';

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = 'Saving... ⏳';
    }

    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
       alert("DATABASE SETUP REQUIRED: Please configure your Firebase credentials in assets/js/wb-database.js");
       throw new Error("Firebase config not set up.");
    }

    // --- DEBUG: Show that we are attempting to save ---
    console.log("Saving to collection:", collectionName);
    
    // Add a new document with a generated id to the collection
    const docRef = await addDoc(collection(db, collectionName), dataObject);
    console.log("Primary document written with ID: ", docRef.id);

    // --- CRM Integration: Add as lead ---
    try {
      const sourceMap = {
        'contact_enquiries': 'Contact Form',
        'internship_applications': 'Internship Form',
        'general_enquiries': 'Website Enquiry'
      };

      // Handle name concatenation for forms using firstName/lastName
      let leadName = dataObject.fullname || dataObject.fullName || dataObject.name;
      if (!leadName && (dataObject.firstName || dataObject.lastName)) {
        leadName = `${dataObject.firstName || ''} ${dataObject.lastName || ''}`.trim();
      }

      const leadData = {
        name: leadName || 'Anonymous',
        email: dataObject.email || '',
        phone: dataObject.phone || dataObject.mobile || dataObject.contact || '',
        course: dataObject.course || dataObject.role || dataObject.qualification || 'General',
        learningMode: dataObject.learningMode || dataObject.mode || dataObject.preferredMode || 'Not specified',
        leadType: dataObject.leadType || 'admission',
        source: sourceMap[collectionName] || 'Website',
        stage: 'new',
        admissionStatus: 'lead',
        lmsAccountStatus: 'not_created',
        notes: dataObject.message || dataObject.notes || dataObject.college || '',
        submittedAt: serverTimestamp(),
        referenceId: docRef.id
      };

      await addDoc(collection(db, 'crm_leads'), leadData);
      console.log("CRM Lead synced successfully");
      alert("SUCCESS: Form submitted and synced to CRM! Check the dashboard now.");
    } catch (crmErr) {
      console.warn("CRM Lead sync failed:", crmErr);
      if (crmErr.code === 'permission-denied') {
        alert("CRM SYNC ERROR: Permission denied for 'crm_leads'. Please ensure your Firestore rules were PUBLISHED correctly in the Firebase Console.");
      } else {
        alert("CRM SYNC ERROR: " + crmErr.message);
      }
    }
    // -------------------------------------
    
    // Close modal if the form is inside one
    const modal = formElement.closest('.wb-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    formElement.reset(); // Clear the form

    // Determine Redirect Category Based on Collection
    let urlType = 'default';
    if (collectionName === 'contact_enquiries') urlType = 'contact';
    else if (collectionName === 'internship_applications') urlType = 'internship';
    else if (collectionName === 'general_enquiries') urlType = 'enquiry';
    else if (collectionName.includes('admission')) urlType = 'admission';

    // Handle relative pathing correctly if deep in a subdirectory like 'erp'
    const basePath = window.location.pathname.includes('/erp/') ? '../' : './';
    
    // Redirect to Aesthetic Thank You Page
    window.location.href = `${basePath}thank-you.html?type=${urlType}`;
    
  } catch (e) {
    console.error("Error adding document: ", e);
    if (e.code === 'permission-denied') {
      alert("DATABASE PERMISSION DENIED: You have not allowed public writes to '" + collectionName + "' in your Firestore rules.");
    } else {
      alert("DATABASE ERROR: " + e.message);
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}

// Attach listeners to forms automatically when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Collect all unique forms on the page
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Prevent double attachment by checking a custom flag
        if (form.dataset.attached === 'true') return;

        let collectionName = 'general_enquiries';

        // Logic to determine collection
        if (form.classList.contains('wb-db-form')) {
          collectionName = form.dataset.collection || 'general_enquiries';
        } else if (form.id === 'internshipRegistrationForm' || form.id === 'internship-application-form') {
          collectionName = 'internship_applications';
        } else if (form.closest('.wb-contact-form')) {
          collectionName = 'contact_enquiries';
        } else if (form.id === 'wbInquiryForm' || form.id === 'enquiry-form') {
            collectionName = 'general_enquiries';
        } else {
          // If none of the above, skip generic forms like search bars or login
          if (form.querySelector('input[type="text"]') || form.querySelector('textarea')) {
            // It's likely a data-gathering form
             collectionName = 'general_submissions';
          } else {
              return; // Skip non-enquiry forms
          }
        }

        form.dataset.attached = 'true';
        form.addEventListener('submit', (e) => submitFormToDatabase(form, collectionName, e));
        console.log(`Attached ${collectionName} listener to:`, form.id || form.className);
    });
});
;
