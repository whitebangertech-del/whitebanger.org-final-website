/**
 * Form Service - Firebase Integration
 * Handles form-related writes and lookups through Firestore.
 */

import { db } from './wb-database.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where
} from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js';

function ok(data = {}) {
  return { success: true, ...data };
}

function fail(label, error) {
  console.error(label, error);
  return { success: false, error: error.message };
}

async function addLead(leadData) {
  const docRef = await addDoc(collection(db, 'crm_leads'), {
    ...leadData,
    stage: leadData.stage || 'new',
    submittedAt: serverTimestamp()
  });
  return { id: docRef.id, ...leadData };
}

export async function submitInquiryForm(formData) {
  try {
    const data = await addLead({
      name: formData.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Anonymous',
      email: formData.email || '',
      phone: formData.phone || formData.contact || '',
      course: formData.course || formData.courseSelection || 'General Inquiry',
      source: formData.source || 'Website',
      notes: formData.message || formData.address || '',
      followUp: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
    });
    return ok({ data });
  } catch (error) {
    return fail('Error submitting inquiry:', error);
  }
}

export async function submitInternshipForm(formData) {
  try {
    const data = await addLead({
      name: formData.fullName || 'Internship Applicant',
      email: formData.email || '',
      phone: formData.mobile || '',
      course: formData.selectedCourse || formData.course || 'Internship',
      source: 'Internship Form',
      notes: `Father: ${formData.fatherName || ''}\nCollege: ${formData.collegeName || ''}\nQualification: ${formData.qualification || ''}\nRoll No: ${formData.universityRollNo || ''}`,
      followUp: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    return ok({ data });
  } catch (error) {
    return fail('Error submitting internship application:', error);
  }
}

export async function verifyCertificate(certificateNumber) {
  try {
    const certNo = certificateNumber.toUpperCase();
    const q = query(
      collection(db, 'certificates'),
      where('certificate_number', '==', certNo),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, message: 'Certificate not found or invalid' };
    }

    const certDoc = snapshot.docs[0];
    return ok({ certificate: { id: certDoc.id, ...certDoc.data() } });
  } catch (error) {
    return fail('Error verifying certificate:', error);
  }
}

export async function submitPayment(paymentData) {
  try {
    const transactionId = `TXN${Date.now()}`;
    const data = {
      student_id: paymentData.studentId,
      amount: Number(paymentData.amount || 0),
      payment_type: paymentData.paymentType || 'tuition_fee',
      payment_method: paymentData.paymentMethod || 'online',
      transaction_id: transactionId,
      status: 'completed',
      payment_date: new Date().toISOString().split('T')[0],
      notes: paymentData.notes || '',
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'payments'), data);
    return ok({ data: { id: docRef.id, ...data }, transactionId });
  } catch (error) {
    return fail('Error submitting payment:', error);
  }
}

export async function getStudentFees(studentId) {
  try {
    const studentSnap = await getDoc(doc(db, 'students', studentId));
    const student = studentSnap.exists() ? studentSnap.data() : {};
    const paymentsSnap = await getDocs(query(
      collection(db, 'payments'),
      where('student_id', '==', studentId),
      where('status', '==', 'completed')
    ));
    const payments = paymentsSnap.docs.map(item => ({ id: item.id, ...item.data() }));
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const totalFee = Number(student.fee || 0);

    return ok({
      totalFee,
      totalPaid,
      remaining: totalFee - totalPaid,
      payments
    });
  } catch (error) {
    return fail('Error fetching student fees:', error);
  }
}

export async function submitExamResult(resultData) {
  try {
    const data = {
      student_id: resultData.studentId,
      exam_id: resultData.examId,
      marks_obtained: Number(resultData.marksObtained || 0),
      total_marks: Number(resultData.totalMarks || 0),
      percentage: Number(resultData.percentage || 0),
      grade: resultData.grade || '',
      rank: resultData.rank ? Number(resultData.rank) : null,
      remarks: resultData.remarks || '',
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'exam_results'), data);
    return ok({ data: { id: docRef.id, ...data } });
  } catch (error) {
    return fail('Error submitting exam result:', error);
  }
}

export async function submitEnquiry(enquiryData) {
  try {
    const data = await addLead({
      name: enquiryData.studentName || 'Admission Enquiry',
      email: enquiryData.email || '',
      phone: enquiryData.contactNumber || enquiryData.phone || '',
      course: enquiryData.courseApplying || 'General',
      source: enquiryData.source || 'Direct',
      notes: `Parent: ${enquiryData.parentName || ''}\nWhatsApp: ${enquiryData.whatsappNumber || ''}\nAddress: ${enquiryData.address || ''}\nPrevious School: ${enquiryData.previousSchool || ''}\nDOB: ${enquiryData.dob || ''}\nGender: ${enquiryData.gender || ''}\nPreferred Mode: ${enquiryData.preferredMode || ''}\nRemarks: ${enquiryData.remarks || ''}`,
      followUp: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    return ok({ data });
  } catch (error) {
    return fail('Error submitting enquiry:', error);
  }
}

export { db };
