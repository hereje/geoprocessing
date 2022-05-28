import React from "react";
import ToolbarCard from "./ToolbarCard";
import ReportDecorator from "./storybook/ReportDecorator";
import { SimpleButton } from "./buttons";

export default {
  component: ToolbarCard,
  title: "Components/Card/ToolbarCard",
  decorators: [ReportDecorator],
};

export const titleOnly = () => (
  <ToolbarCard title="ToolbarCard Title">
    <p>Body text goes here.</p>
  </ToolbarCard>
);

const items = (
  <div>
    <SimpleButton>⬇</SimpleButton>
    <SimpleButton>➥</SimpleButton>
  </div>
);

export const buttons = () => (
  <ToolbarCard title="Card with Tools" items={items}>
    <p>Body text goes here.</p>
  </ToolbarCard>
);
