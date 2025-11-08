import React, { useEffect } from "react";
import styled from "styled-components";
import type { CustomNodeProps } from ".";
import useConfig from "../../../../../store/useConfig";
import { isContentImage } from "../lib/utils/calculateNodeSize";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import useGraph from "../stores/useGraph";

const StyledTextNodeWrapper = styled.span<{ $isParent: boolean }>`
  display: flex;
  justify-content: ${({ $isParent }) => ($isParent ? "center" : "flex-start")};
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0 10px;
  cursor: text;
  &:hover .edit-button {
    opacity: 1;
  }
`;

const StyledEditButton = styled.button`
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  background: ${({ theme }) => theme.INTERACTIVE_ACTIVE};
  border: none;
  border-radius: 3px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 10px;
  color: white;
  transition: opacity 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.INTERACTIVE_HOVER};
  }
`;

const StyledEditInput = styled.input`
  width: 100%;
  background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
  border: 2px solid ${({ theme }) => theme.INTERACTIVE_ACTIVE};
  color: ${({ theme }) => theme.TEXT_NORMAL};
  padding: 4px 8px;
  font-family: inherit;
  font-size: inherit;
  border-radius: 4px;
  outline: none;
`;

const StyledImageWrapper = styled.div`
  padding: 5px;
`;

const StyledImage = styled.img`
  border-radius: 2px;
  object-fit: contain;
  background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
`;

const Node = ({ node, x, y }: CustomNodeProps) => {
  const { text, width, height } = node;
  const imagePreviewEnabled = useConfig(state => state.imagePreviewEnabled);
  const isImage = imagePreviewEnabled && isContentImage(JSON.stringify(text[0].value));
  const value = text[0].value;

  const [isEditing, setIsEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState(String(value));
  const inputRef = React.useRef<HTMLInputElement>(null);

  console.log("TextNode rendering:", { nodeId: node.id, value, isEditing });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Edit button clicked!");
    console.log("Node:", node);
    setIsEditing(true);
  };

  const saveChanges = () => {
    console.log("Saving changes:", editedText);
    if (editedText !== String(value)) {
      useGraph.getState().updateNodeText(node.id, editedText);
    }
    setIsEditing(false);
  };

  const handleBlur = () => {
    saveChanges();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      saveChanges();
    } else if (event.key === "Escape") {
      setEditedText(String(value));
      setIsEditing(false);
    }
  };

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={width}
      height={height}
      x={0}
      y={0}
    >
      {isImage ? (
        <StyledImageWrapper>
          <StyledImage src={JSON.stringify(text[0].value)} width="70" height="70" loading="lazy" />
        </StyledImageWrapper>
      ) : (
        <StyledTextNodeWrapper
          data-x={x}
          data-y={y}
          data-key={JSON.stringify(text)}
          $isParent={false}
        >
          {isEditing ? (
            <StyledEditInput
              ref={inputRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          ) : (
       <>
              <Styled.StyledKey $value={value} $type={typeof text[0].value}>
                <TextRenderer>{value}</TextRenderer>
              </Styled.StyledKey>
              <StyledEditButton 
                className="edit-button"
                onClick={handleEditClick}
              >
                ✏️
              </StyledEditButton>
            </>
          )}  
        </StyledTextNodeWrapper>
      )}
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return prev.node.text === next.node.text && prev.node.width === next.node.width;
}

export const TextNode = React.memo(Node, propsAreEqual);