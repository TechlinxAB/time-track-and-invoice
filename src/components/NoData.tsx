
import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon, Users } from "lucide-react";

type NoDataProps = {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  icon?: LucideIcon;
};

const NoData: React.FC<NoDataProps> = ({ 
  title, 
  description, 
  buttonText, 
  onButtonClick, 
  icon: Icon = Users 
}) => {
  return (
    <div className="text-center py-12 space-y-4 animate-fade-in bg-white rounded-xl shadow-sm p-8 border border-border/40">
      <div className="inline-block p-4 rounded-full bg-muted/30 mb-2">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      {buttonText && onButtonClick && (
        <Button 
          className="mt-2 bg-success hover:bg-success/90 text-success-foreground" 
          onClick={onButtonClick}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default NoData;
