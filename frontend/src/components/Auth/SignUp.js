/**
 * Sign Up Component
 * Multi-step registration with profile questions.
 */
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthForms.module.css';

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to programming or just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with basics, building projects' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced developer with deep knowledge' },
];

const PROGRAMMING_LANGUAGES = [
  'Python', 'C++', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'Java', 'C#', 'MATLAB'
];

const SYSTEM_TYPES = [
  { value: 'Desktop', label: 'Desktop PC' },
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Cloud', label: 'Cloud/Remote' },
  { value: 'Workstation', label: 'Workstation' },
];

export default function SignUp({ onSuccess, onSwitchMode }) {
  const { signUp, loading, error } = useAuth();
  const [step, setStep] = useState(1);
  const [localError, setLocalError] = useState('');

  // Step 1: Basic info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Step 2: Background profile
  const [softwareBackground, setSoftwareBackground] = useState('beginner');
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [aiMlExperience, setAiMlExperience] = useState('beginner');

  // Step 3: Hardware
  const [hardwareCpu, setHardwareCpu] = useState('');
  const [hardwareGpu, setHardwareGpu] = useState('');
  const [systemType, setSystemType] = useState('Desktop');

  const toggleLanguage = (lang) => {
    setProgrammingLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const validateStep = () => {
    setLocalError('');

    if (step === 1) {
      if (!email || !password || !name) {
        setLocalError('Please fill in all fields');
        return false;
      }
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters');
        return false;
      }
      if (!email.includes('@')) {
        setLocalError('Please enter a valid email');
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const profile = {
      software_background: softwareBackground,
      programming_languages: programmingLanguages,
      ai_ml_experience: aiMlExperience,
      hardware_cpu: hardwareCpu || 'Unknown',
      hardware_gpu: hardwareGpu || null,
      system_type: systemType,
    };

    const result = await signUp(email, password, name, profile);
    if (result.success) {
      onSuccess?.();
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Progress indicator */}
      <div className={styles.progress}>
        <div className={styles.progressBar} style={{ width: `${(step / 3) * 100}%` }} />
        <div className={styles.steps}>
          <span className={step >= 1 ? styles.activeStep : ''}>Account</span>
          <span className={step >= 2 ? styles.activeStep : ''}>Background</span>
          <span className={step >= 3 ? styles.activeStep : ''}>Hardware</span>
        </div>
      </div>

      {(localError || error) && (
        <div className={styles.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {localError || error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className={styles.stepContent}>
          <div className={styles.field}>
            <label htmlFor="signup-name" className={styles.label}>
              Display Name
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-password" className={styles.label}>
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          </div>

          <button
            type="button"
            onClick={nextStep}
            className={styles.submitButton}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Background Profile */}
      {step === 2 && (
        <div className={styles.stepContent}>
          <div className={styles.field}>
            <label className={styles.label}>Software Development Experience</label>
            <div className={styles.radioGroup}>
              {SKILL_LEVELS.map(level => (
                <label key={level.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="software"
                    value={level.value}
                    checked={softwareBackground === level.value}
                    onChange={(e) => setSoftwareBackground(e.target.value)}
                    className={styles.radio}
                  />
                  <span className={styles.radioContent}>
                    <strong>{level.label}</strong>
                    <small>{level.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Programming Languages (select all that apply)</label>
            <div className={styles.chipGroup}>
              {PROGRAMMING_LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`${styles.chip} ${programmingLanguages.includes(lang) ? styles.chipActive : ''}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>AI / Machine Learning Experience</label>
            <div className={styles.radioGroup}>
              {SKILL_LEVELS.map(level => (
                <label key={level.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="aiml"
                    value={level.value}
                    checked={aiMlExperience === level.value}
                    onChange={(e) => setAiMlExperience(e.target.value)}
                    className={styles.radio}
                  />
                  <span className={styles.radioContent}>
                    <strong>{level.label}</strong>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              onClick={prevStep}
              className={styles.secondaryButton}
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className={styles.submitButton}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Hardware */}
      {step === 3 && (
        <div className={styles.stepContent}>
          <div className={styles.field}>
            <label className={styles.label}>System Type</label>
            <div className={styles.selectWrapper}>
              <select
                value={systemType}
                onChange={(e) => setSystemType(e.target.value)}
                className={styles.select}
              >
                {SYSTEM_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="hardware-cpu" className={styles.label}>
              CPU (optional)
            </label>
            <input
              id="hardware-cpu"
              type="text"
              value={hardwareCpu}
              onChange={(e) => setHardwareCpu(e.target.value)}
              className={styles.input}
              placeholder="e.g., Intel i7-12700K, Apple M2"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="hardware-gpu" className={styles.label}>
              GPU (optional - important for AI workloads)
            </label>
            <input
              id="hardware-gpu"
              type="text"
              value={hardwareGpu}
              onChange={(e) => setHardwareGpu(e.target.value)}
              className={styles.input}
              placeholder="e.g., NVIDIA RTX 4090, No GPU"
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              onClick={prevStep}
              className={styles.secondaryButton}
            >
              Back
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? <span className={styles.spinner} /> : 'Create Account'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.switchMode}>
        <span>Already have an account?</span>
        <button
          type="button"
          onClick={onSwitchMode}
          className={styles.switchButton}
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
