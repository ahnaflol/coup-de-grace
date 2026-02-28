import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PropertyField } from "@/components/detail-page/property-field";

interface Property {
  label: string;
  value: string;
  field: string;
  type: "text" | "email" | "phone" | "select" | "date";
  options?: { label: string; value: string }[];
}

interface AboutSidebarProps {
  properties: Property[];
  onUpdate: (field: string, value: string) => void;
}

export function AboutSidebar({ properties, onUpdate }: AboutSidebarProps) {
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-sm">About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        {properties.map((prop) => (
          <PropertyField
            key={prop.field}
            label={prop.label}
            value={prop.value}
            field={prop.field}
            type={prop.type}
            options={prop.options}
            onUpdate={onUpdate}
          />
        ))}
      </CardContent>
    </Card>
  );
}
