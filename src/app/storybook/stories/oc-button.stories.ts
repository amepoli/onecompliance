import type { Meta, StoryObj } from '@storybook/angular';
import {
  argsToTemplate,
  moduleMetadata,
  applicationConfig,
} from '@storybook/angular';


import { OCButtonComponent } from './oc-button.component';

const meta: Meta<OCButtonComponent> = {
  title: 'Example/OCButton',
  component: OCButtonComponent,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    type: 'filled',
    label: 'This is a test',
    disabled: false
  },
};

export default meta;
type Story = StoryObj<OCButtonComponent>;


export const Filled: Story = {
  args: {
    type: 'filled',
    label: 'Press me',
    disabled: false
  }
}

export const FilledLarge: Story = {
  args: {
    type: 'filled',
    label: 'Press me',
    disabled: false,
    size: 'large'
  }
}

export const FilledDisabled: Story = {
  args: {
    type: 'filled',
    label: 'Press me',
    disabled: true
  }
}

export const Outlined: Story = {
  args: {
    type: 'outlined',
    label: 'Press me',
    disabled: false
  }
}

export const OutlinedLarge: Story = {
  args: {
    type: 'outlined',
    label: 'Press me',
    disabled: false,
    size: 'large'
  }
}

export const OutlinedDisabled: Story = {
  args: {
    type: 'outlined',
    label: 'Press me',
    disabled: true
  }
}



export const Text: Story = {
  args: {
    type: 'text',
    label: 'Press me',
    disabled: false
  }
}

export const TextLarge: Story = {
  args: {
    type: 'text',
    label: 'Press me',
    disabled: false,
    size: 'large'
  }
}

export const TextDisabled: Story = {
  args: {
    type: 'text',
    label: 'Press me',
    disabled: true
  }
}
