
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

const ImportInfo = () => {
  const handleDownloadTemplate = () => {
    const template = "Which president signed the Declaration of Independence?,US History,John Adams,Thomas Jefferson,George Washington,Benjamin Franklin,Thomas Jefferson,Medium\nWhich amendment to the US Constitution abolished slavery?,US History,13th Amendment,14th Amendment,15th Amendment,Emancipation Proclamation,13th Amendment,Medium\nWho was the first female Supreme Court Justice?,US History,Sandra Day O'Connor,Ruth Bader Ginsburg,Elena Kagan,Sonia Sotomayor,Sandra Day O'Connor,Medium";
    
    const element = document.createElement('a');
    const file = new Blob([template], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = 'trivia_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Static Questions</CardTitle>
        <CardDescription>
          Sign in to keep your questions when you return
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          We've updated the system to use static questions instead of database storage to reduce database usage and costs. When you import questions:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
          <li>A set of default questions is always available to all users</li>
          <li>When logged in, your imported questions will be saved to your account and available when you return</li>
          <li>You can export the full collection to save it locally</li>
          <li>Import that exported file later to restore your collection</li>
          <li>This approach significantly reduces database costs while maintaining functionality</li>
        </ul>
        <div className="bg-muted p-3 rounded-md">
          <h4 className="text-sm font-medium mb-2">CSV Template Example</h4>
          <pre className="overflow-x-auto text-xs">
            <code>
              Which planet is known as the Red Planet?,Science,Venus,Mars,Jupiter,Saturn,Mars,Easy<br/>
              Who painted the Mona Lisa?,Art,Vincent van Gogh,Leonardo da Vinci,Pablo Picasso,Michelangelo,Leonardo da Vinci,Easy<br/>
              In which year did World War II end?,History,1943,1944,1945,1946,1945,Medium
            </code>
          </pre>
          <Button variant="outline" className="mt-3" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportInfo;
