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

export default function HomePage() {
  return (
    <>
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
