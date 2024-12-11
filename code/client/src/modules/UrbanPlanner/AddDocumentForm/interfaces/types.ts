// Define the Document interface
export interface NewDocument {
  //DocumentID: number;
  title: string;
  description: string;
  documentType: string; //same thing as scale
  scale: string;
  nodeType: string;
  stakeholders: string[];
  issuanceDate: string;
  language: string;
  pages: string;
  //Connections: number;
  georeference: number[][] | null;
  georeferenceName?: string;
  areaColor?: string | null;
}

export interface Props {
  document: NewDocument;
  //newDocID?: number; // Add this to allow newDocID to be passed
  setDocument: React.Dispatch<React.SetStateAction<NewDocument>>;
  //showMiniMap: boolean;
  //setShowMiniMap: (show: boolean) => void;
}
