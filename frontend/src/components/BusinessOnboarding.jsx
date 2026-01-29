import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost, apiGet } from '../utils/api.js';
import { showError, showSuccess } from '../utils/toast.js';

const steps = [
  { id: 1, title: 'Business details' },
  { id: 2, title: 'Main branch details' },
  { id: 3, title: 'Manager details' },
  { id: 4, title: 'Subscription plan' },
];

const BusinessOnboarding = ({ onCompleted }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1 - business details
    business_name: '',
    business_address: '',
    business_city: '',
    business_phone_number: '',
    business_email: '',
    business_type: '',
    tax_number: '',
    // Step 2 - branch details
    branch_name: '',
    branch_address: '',
    branch_city: '',
    branch_phone_number: '',
    branch_email: '',
    // Step 3 - manager details
    manager_first_name: '',
    manager_last_name: '',
    manager_email: '',
    manager_phone_number: '',
    manager_gender: '',
    manager_password: '',
    manager_password_confirm: '',
    // Step 4 - pricing plan
    pricing_plan_id: null,
    selected_pricing_plan: null,
  });

  // Fetch pricing plans on component mount (no authentication required)
  useEffect(() => {
    const fetchPricingPlans = async () => {
      setLoadingPlans(true);
      try {
        // Fetch pricing plans without authentication headers
        const response = await apiGet('/finances/pricing-plans/', false);
        if (response.ok) {
          const data = await response.json();
          // Handle both array and paginated response formats
          const plans = Array.isArray(data) ? data : (data.results || []);
          setPricingPlans(plans);
        } else {
          console.error('Failed to fetch pricing plans');
        }
      } catch (error) {
        console.error('Error fetching pricing plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPricingPlans();
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.business_name || !formData.business_address || !formData.business_city || 
          !formData.business_phone_number || !formData.business_email || !formData.business_type || !formData.tax_number) {
        showError('Please fill in all required business details.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.branch_name || !formData.branch_address || !formData.branch_city || 
          !formData.branch_phone_number || !formData.branch_email) {
        showError('Please fill in all required branch details.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formData.manager_first_name || !formData.manager_last_name || !formData.manager_email || 
          !formData.manager_phone_number || !formData.manager_gender || !formData.manager_password) {
        showError('Please fill in all required manager details.');
        return false;
      }
      if (formData.manager_password !== formData.manager_password_confirm) {
        showError('Passwords do not match. Please make sure both password fields are the same.');
        return false;
      }
      if (formData.manager_password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return false;
      }
    }
    if (currentStep === 4) {
      if (!formData.pricing_plan_id || !formData.selected_pricing_plan) {
        showError('Please select a subscription plan.');
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
        '/core/business-onboarding/',
        {
          business_details: {
            name: formData.business_name,
            address: formData.business_address,
            city: formData.business_city,
            phone_number: formData.business_phone_number,
            email: formData.business_email,
            business_type: formData.business_type,
            tax_number: formData.tax_number,
          },
          branch_details: {
            name: formData.branch_name,
            address: formData.branch_address,
            city: formData.branch_city,
            phone_number: formData.branch_phone_number,
            email: formData.branch_email,
          },
          manager_details: {
            first_name: formData.manager_first_name,
            last_name: formData.manager_last_name,
            email: formData.manager_email,
            phone_number: formData.manager_phone_number,
            gender: formData.manager_gender,
            password: formData.manager_password,
          },
          pricing_plan: {
            id: formData.selected_pricing_plan.id,
            name: formData.selected_pricing_plan.name,
            cost: parseFloat(formData.selected_pricing_plan.cost) || 0,
            pilot_period: formData.selected_pricing_plan.pilot_period,
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

      // Navigate to success page
      navigate('/onboarding-success', { replace: true });
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
                placeholder="e.g. Juja Electronics"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Address<span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.business_address}
                onChange={(e) => updateField('business_address', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                rows={2}
                placeholder="e.g. Opposite Juja Bus Stage"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                City<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.business_city}
                onChange={(e) => updateField('business_city', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                placeholder="e.g. Juja"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.business_phone_number}
                  onChange={(e) => updateField('business_phone_number', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. 071234568"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => updateField('business_email', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. info@je.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Business type<span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) => updateField('business_type', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                >
                  <option value="">Select business type</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Supermarket">Supermarket</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tax number<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tax_number}
                  onChange={(e) => updateField('tax_number', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. AHSHJSJSLLSLS"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Branch name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.branch_name}
                onChange={(e) => updateField('branch_name', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                placeholder="e.g. Main Branch"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Address<span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.branch_address}
                onChange={(e) => updateField('branch_address', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                rows={2}
                placeholder="e.g. Opposite Juja Bus Station"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                City<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.branch_city}
                onChange={(e) => updateField('branch_city', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                placeholder="e.g. Juja"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.branch_phone_number}
                  onChange={(e) => updateField('branch_phone_number', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. 07123456372"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.branch_email}
                  onChange={(e) => updateField('branch_email', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. jujabranch@gmail.com"
                />
              </div>
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
                  value={formData.manager_first_name}
                  onChange={(e) => updateField('manager_first_name', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. John"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Last name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.manager_last_name}
                  onChange={(e) => updateField('manager_last_name', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Paul"
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
                  value={formData.manager_email}
                  onChange={(e) => updateField('manager_email', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. johnpaul@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.manager_phone_number}
                  onChange={(e) => updateField('manager_phone_number', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. 07123456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Gender<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.manager_gender}
                onChange={(e) => updateField('manager_gender', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password<span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.manager_password}
                  onChange={(e) => updateField('manager_password', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Create a password"
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm Password<span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.manager_password_confirm}
                  onChange={(e) => updateField('manager_password_confirm', e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2.5 border-2 rounded-lg focus:outline-none text-sm sm:text-base ${
                    formData.manager_password_confirm && formData.manager_password !== formData.manager_password_confirm
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Re-enter password"
                />
                {formData.manager_password_confirm && formData.manager_password !== formData.manager_password_confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 sm:space-y-5">
            {loadingPlans ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading pricing plans...</p>
              </div>
            ) : pricingPlans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No pricing plans available. Please contact support.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pricingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => {
                      updateField('pricing_plan_id', plan.id);
                      updateField('selected_pricing_plan', plan);
                    }}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.pricing_plan_id === plan.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
                      {formData.pricing_plan_id === plan.id && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-gray-900">
                        {parseFloat(plan.cost) === 0 ? 'Free' : `KES ${parseFloat(plan.cost).toLocaleString()}`}
                      </p>
                      {plan.pilot_period && (
                        <p className="text-sm text-gray-600">
                          {plan.pilot_period} day{plan.pilot_period !== 1 ? 's' : ''} pilot period
                        </p>
                      )}
                      {plan.duration_days && plan.duration_days !== plan.pilot_period && (
                        <p className="text-xs text-gray-500">
                          Duration: {plan.duration_days} day{plan.duration_days !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        By completing onboarding you will create your business, main branch, manager account, and select your subscription plan.
      </p>
    </form>
  );
};

export default BusinessOnboarding;

