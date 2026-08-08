const WIZARD_DONE_KEY = 'inkflow-first-booking-wizard-done';
const WIZARD_STEP_KEY = 'inkflow-first-booking-wizard-step';

export function getFirstBookingWizardDone(): boolean {
  try {
    return localStorage.getItem(WIZARD_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setFirstBookingWizardDone(done: boolean): void {
  try {
    if (done) localStorage.setItem(WIZARD_DONE_KEY, '1');
    else localStorage.removeItem(WIZARD_DONE_KEY);
  } catch {
    //
  }
}

export function getFirstBookingWizardStep(): number {
  try {
    const n = Number.parseInt(localStorage.getItem(WIZARD_STEP_KEY) ?? '0', 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setFirstBookingWizardStep(step: number): void {
  try {
    localStorage.setItem(WIZARD_STEP_KEY, String(Math.max(0, step)));
  } catch {
    //
  }
}
