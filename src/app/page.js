import About from "@/components/About/About";
import Body from "@/components/Body/Body";
import FAQ from "@/components/FAQ/FAQS";
import FeatureSection from "@/components/Features/Features";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import PricingSection from "@/components/Pricing/Pricing";
import TestimonialSection from "@/components/Testimonials/Testimonials";
import "@/assets/css/output.css"
import "@/assets/css/style.css"
import "@/assets/css/swiper-bundle.min.css"

export default function Home() {
  return (
    <>
      <Header/>
      <div className="w-full overflow-hidden">
      <Body />
      <FeatureSection />
      <About/>
      <PricingSection/>
      <FAQ/>
      <TestimonialSection/>
      <Footer/>
      </div>
    </>
  );
}
