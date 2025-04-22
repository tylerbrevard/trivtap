
import React from "react";

interface DisplayFooterProps {
  currentState: string;
  gameCode: string;
}

export const DisplayFooter = ({
  currentState,
  gameCode,
}: DisplayFooterProps) => (
  <footer className="p-4 border-t border-border text-center text-sm text-muted-foreground">
    {currentState !== "join" && (
      <div className="flex justify-center mb-2">
        <div className="bg-card px-4 py-2 rounded-full">
          Join code: <span className="font-bold text-primary">{gameCode}</span>
        </div>
      </div>
    )}
    <p>Powered by TrivTap</p>
  </footer>
);

