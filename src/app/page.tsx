import { IntroSequence } from "@/components/IntroSequence";
import { FinalCta } from "@/components/sections/FinalCta";
import { Features } from "@/components/sections/Features";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LiveData } from "@/components/sections/LiveData";
import { Navbar } from "@/components/sections/Navbar";
import { ProblemSolution } from "@/components/sections/ProblemSolution";
import { Testimonial } from "@/components/sections/Testimonial";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { UseCases } from "@/components/sections/UseCases";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SceneLoader } from "@/components/three/SceneLoader";
import { INTRO_BOOT_SCRIPT } from "@/lib/intro";

export default function HomePage() {
  return (
    <>
      {/* Runs while the HTML is parsed, so the hero is in its intro state from first paint. */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />
      <IntroSequence />
      <SmoothScroll />
      <SceneLoader />
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <TrustStrip />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <LiveData />
        <UseCases />
        <Testimonial />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
