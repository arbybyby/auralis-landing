export interface IntroContent {
  /** Visible label of the control that skips the intro. */
  skip: string;
  /** Accessible name of that control. */
  skipLabel: string;
  /** Accessible name of the loading progress bar. */
  progressLabel: string;
}

export const intro: IntroContent = {
  skip: "Skip",
  skipLabel: "Skip the intro",
  progressLabel: "Loading the planet",
};
