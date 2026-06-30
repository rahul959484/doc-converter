import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Home from "@/pages/home";
import ImageToPdf from "@/pages/image-to-pdf";
import CompressImage from "@/pages/compress-image";
import CompressPdf from "@/pages/compress-pdf";
import MergePdf from "@/pages/merge-pdf";
import SplitPdf from "@/pages/split-pdf";
import RotatePdf from "@/pages/rotate-pdf";
import WatermarkPdf from "@/pages/watermark-pdf";
import PageNumbersPdf from "@/pages/page-numbers-pdf";
import OrganizePdf from "@/pages/organize-pdf";
import PdfToImage from "@/pages/pdf-to-image";
import HtmlToPdf from "@/pages/html-to-pdf";
import UnlockPdf from "@/pages/unlock-pdf";
import SignPdf from "@/pages/sign-pdf";
import RepairPdf from "@/pages/repair-pdf";
import RemovePages from "@/pages/remove-pages";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/image-to-pdf" component={ImageToPdf} />
        <Route path="/compress-image" component={CompressImage} />
        <Route path="/compress-pdf" component={CompressPdf} />
        <Route path="/merge-pdf" component={MergePdf} />
        <Route path="/split-pdf" component={SplitPdf} />
        <Route path="/rotate-pdf" component={RotatePdf} />
        <Route path="/watermark-pdf" component={WatermarkPdf} />
        <Route path="/page-numbers-pdf" component={PageNumbersPdf} />
        <Route path="/organize-pdf" component={OrganizePdf} />
        <Route path="/pdf-to-image" component={PdfToImage} />
        <Route path="/html-to-pdf" component={HtmlToPdf} />
        <Route path="/unlock-pdf" component={UnlockPdf} />
        <Route path="/sign-pdf" component={SignPdf} />
        <Route path="/repair-pdf" component={RepairPdf} />
        <Route path="/remove-pages" component={RemovePages} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="docconvert-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
