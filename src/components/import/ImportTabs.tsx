
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImportQuestions from "./ImportQuestions";
import DuplicateQuestionRemover from "@/components/DuplicateQuestionRemover";

const ImportTabs = () => {
  return (
    <Tabs defaultValue="import">
      <TabsList className="grid grid-cols-2 w-[400px]">
        <TabsTrigger value="import">Import Questions</TabsTrigger>
        <TabsTrigger value="manage">Manage Questions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="import">
        <ImportQuestions />
      </TabsContent>
      
      <TabsContent value="manage">
        <DuplicateQuestionRemover />
      </TabsContent>
    </Tabs>
  );
};

export default ImportTabs;
