import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, TextInput, ColorInput, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedData, setEditedData] = React.useState<{ name?: string; color?: string }>({});

  React.useEffect(() => {
    if (nodeData?.text && opened) {
      // Extract name and color from the node data
      const data: any = {};
      nodeData.text.forEach(row => {
        if (row.key === "name") data.name = String(row.value);
        if (row.key === "color") data.color = String(row.value);
      });
      setEditedData(data);
      setIsEditing(false);
    }
  }, [nodeData, opened]);

  const handleSave = () => {
    try {
      const currentJson = useJson.getState().json;
      const jsonData = JSON.parse(currentJson);

      if (!nodeData?.path || nodeData.path.length === 0) {
        console.error("No path found");
        return;
      }

      // Navigate to the object in JSON
      let target = jsonData;
      for (let i = 0; i < nodeData.path.length; i++) {
        target = target[nodeData.path[i]];
      }

      // Update the fields
      if (editedData.name !== undefined) target.name = editedData.name;
      if (editedData.color !== undefined) target.color = editedData.color;

      // Save to both stores
      const newJson = JSON.stringify(jsonData, null, 2);
      
      // Update the text editor (left side)
      useFile.getState().setContents({ contents: newJson, hasChanges: true, skipUpdate: true });
      
      // Update the JSON store and graph
      useJson.getState().setJson(newJson);
      
      // Update the selected node data to reflect changes immediately in the modal
      setTimeout(() => {
        const updatedNode = useGraph.getState().nodes.find(n => n.id === nodeData.id);
        if (updatedNode) {
          useGraph.getState().setSelectedNode(updatedNode);
        }
      }, 100);
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    const data: any = {};
    nodeData?.text.forEach(row => {
      if (row.key === "name") data.name = String(row.value);
      if (row.key === "color") data.color = String(row.value);
    });
    setEditedData(data);
    setIsEditing(false);
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Group gap="xs">
              {!isEditing && (
                <Button size="xs" variant="light" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              <CloseButton onClick={onClose} />
            </Group>
          </Flex>

          {isEditing ? (
            <Stack gap="sm" p="md" style={{ border: "1px solid #e0e0e0", borderRadius: 4 }}>
              <TextInput
                label="Name"
                value={editedData.name || ""}
                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
              />
              <ColorInput
                label="Color"
                value={editedData.color || "#000000"}
                onChange={(color) => setEditedData({ ...editedData, color })}
              />
              <Group gap="xs" justify="flex-end">
                <Button size="xs" variant="default" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="xs" onClick={handleSave}>
                  Save
                </Button>
              </Group>
            </Stack>
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={normalizeNodeData(nodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          )}
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
