import type { BodyComponent } from "../../types/body";
import type { ReportVariable } from "../../types/text-block";
import { ChartPropsPanel } from "../chart/ChartPropsPanel";
import { ImagePropsPanel } from "../image/ImagePropsPanel";
import { TablePropsPanel } from "../table/TablePropsPanel";
import { TextBlockPropsPanel } from "../text-block/TextBlockPropsPanel";

/**
 * Dispatcher — picks the right props panel for `comp.type`.
 */
export function BodyCompPropsPanel({
  comp,
  onUpdate,
  onDelete,
  onDuplicate,
  centralData,
  onUpdateCentralData,
  componentDataSources,
  onUpdateComponentDataSources,
  reportVariables,
  onUpdateReportVariables,
}: {
  comp: BodyComponent;
  onUpdate: (c: BodyComponent) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  centralData?: Record<string, any[]>;
  onUpdateCentralData?: (cd: Record<string, any[]>) => void;
  componentDataSources?: Record<string, any[]>;
  onUpdateComponentDataSources?: (cds: Record<string, any[]>) => void;
  reportVariables?: ReportVariable[];
  onUpdateReportVariables?: (v: ReportVariable[]) => void;
}) {
  if (comp.type === "TABLE") {
    return (
      <TablePropsPanel
        comp={comp}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        centralData={centralData}
        onUpdateCentralData={onUpdateCentralData}
        componentDataSources={componentDataSources}
        onUpdateComponentDataSources={onUpdateComponentDataSources}
      />
    );
  }
  if (comp.type === "CHART") {
    return (
      <ChartPropsPanel
        comp={comp}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        centralData={centralData}
        onUpdateCentralData={onUpdateCentralData}
        componentDataSources={componentDataSources}
        onUpdateComponentDataSources={onUpdateComponentDataSources}
      />
    );
  }
  if (comp.type === "IMAGE") {
    return (
      <ImagePropsPanel
        comp={comp}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        centralData={centralData}
        onUpdateCentralData={onUpdateCentralData}
        componentDataSources={componentDataSources}
        onUpdateComponentDataSources={onUpdateComponentDataSources}
      />
    );
  }
  return (
    <TextBlockPropsPanel
      comp={comp}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      reportVariables={reportVariables}
      onUpdateReportVariables={onUpdateReportVariables}
      componentDataSources={componentDataSources}
      onUpdateComponentDataSources={onUpdateComponentDataSources}
      centralData={centralData}
      onUpdateCentralData={onUpdateCentralData}
    />
  );
}
