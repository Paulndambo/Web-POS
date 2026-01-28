import React, { useState } from 'react';
import { apiPost } from '../utils/api.js';
import { showError, showSuccess } from '../utils/toast.js';

const steps = [
  { id: 1, title: 'Business details' },
  { id: 2, title: 'Main branch details' },
  { id: 3, title: 'Admin / contact person' },
];

const BusinessOnboarding = ({ onCompleted }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1 - business
    business_name: '',
    registration_number: '',
    industry: '',
    business_email: '',
    business_phone: '',
    country: '',
    city: '',
    address: '',
    // Step 2 - branch
    branch_name: '',
    branch_code: '',
    branch_phone: '',
    branch_email: '',
    branch_address: '',
    // Step 3 - admin/contact
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    admin_password_confirm: '',
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.business_name || !formData.business_email || !formData.business_phone) {
        showError('Please fill in the required business details.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.branch_name || !formData.branch_phone) {
        showError('Please fill in the required branch details.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formData.admin_first_name || !formData.admin_last_name || !formData.admin_email || !formData.admin_password) {
        showError('Please fill in the required admin details.');
        return false;
      }
      if (formData.admin_password !== formData.admin_password_confirm) {
        showError('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsSubmitting(true);

    try {
      const response = await apiPost(
        '/businesses/self-onboard/',
        {
          business: {
            name: formData.business_name,
            registration_number: formData.registration_number,
            industry: formData.industry,
            email: formData.business_email,
            phone: formData.business_phone,
            country: formData.country,
            city: formData.city,
            address: formData.address,
          },
          branch: {
            name: formData.branch_name,
            code: formData.branch_code,
            phone: formData.branch_phone,
            email: formData.branch_email,
            address: formData.branch_address,
          },
          admin_user: {
            first_name: formData.admin_first_name,
            last_name: formData.admin_last_name,
            email: formData.admin_email,
            phone: formData.admin_phone,
            password: formData.admin_password,
          },
        },
        false
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
          errorData.detail ||
          errorData.message ||
          'We could not complete onboarding. Please check your details and try again.';
        showError(msg);
        return;
      }

      showSuccess('Business successfully onboarded. You can now sign in as the admin user.');
      if (onCompleted) {
        onCompleted();
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      showError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepFields = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Business name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                placeholder="e.g. Acme Retail Ltd"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Registration number
                </label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => updateField('registration_number', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Restaurant, Retail, Pharmacy"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Business email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => updateField('business_email', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. info@acmeretail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Business phone<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.business_phone}
                  onChange={(e) => updateField('business_phone', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. +254 700 000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Kenya"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Nairobi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                rows={2}
                placeholder="Street, building, landmarks..."
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Main branch name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.branch_name}
                onChange={(e) => updateField('branch_name', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                placeholder="e.g. CBD Branch"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Branch code
                </label>
                <input
                  type="text"
                  value={formData.branch_code}
                  onChange={(e) => updateField('branch_code', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Branch phone<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.branch_phone}
                  onChange={(e) => updateField('branch_phone', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. +254 700 000001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Branch email
                </label>
                <input
                  type="email"
                  value={formData.branch_email}
                  onChange={(e) => updateField('branch_email', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. cbd@acmeretail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Branch address
              </label>
              <textarea
                value={formData.branch_address}
                onChange={(e) => updateField('branch_address', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                rows={2}
                placeholder="Street, building, landmarks..."
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  First name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.admin_first_name}
                  onChange={(e) => updateField('admin_first_name', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Jane"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Last name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.admin_last_name}
                  onChange={(e) => updateField('admin_last_name', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => updateField('admin_email', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Admin login email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.admin_phone}
                  onChange={(e) => updateField('admin_phone', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password<span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.admin_password}
                  onChange={(e) => updateField('admin_password', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Create a strong password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm password<span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.admin_password_confirm}
                  onChange={(e) => updateField('admin_password_confirm', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Re-type password"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 flex items-center justify-between gap-2 sm:gap-3">
          {steps.map((step) => (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold ${
                  step.id <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.id}
              </div>
              <span className="mt-1 text-[10px] sm:text-xs text-center text-gray-600">
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
        {renderStepFields()}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
          className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {currentStep < steps.length && (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="ml-auto px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}

        {currentStep === steps.length && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Complete onboarding'}
          </button>
        )}
      </div>

      <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
        By completing onboarding you will create your business, main branch and the first admin
        user who can log in and manage POS operations.
      </p>
    </form>
  );
};

export default BusinessOnboarding;

