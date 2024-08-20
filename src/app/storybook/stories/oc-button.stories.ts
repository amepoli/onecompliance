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
    type: 'primary',
    label: 'This is a test',
    disabled: false
  },
};

export default meta;
type Story = StoryObj<OCButtonComponent>;


export const Primary: Story = {
  args: {
    type: 'primary',
    label: 'Press me',
    disabled: false
  }
}

export const PrimaryLarge: Story = {
  args: {
    type: 'primary',
    label: 'Press me',
    disabled: false,
    size: 'large'
  }
}

export const PrimaryDisabled: Story = {
  args: {
    type: 'primary',
    label: 'Press me',
    disabled: true
  }
}

export const Secondary: Story = {
  args: {
    type: 'secondary',
    label: 'Press me',
    disabled: false
  }
}

export const SecondaryLarge: Story = {
  args: {
    type: 'secondary',
    label: 'Press me',
    disabled: false,
    size: 'large'
  }
}

export const SecondaryDisabled: Story = {
  args: {
    type: 'secondary',
    label: 'Press me',
    disabled: true
  }
}



export const Light: Story = {
  args: {
    type: 'light',
    label: 'Press me',
    disabled: false
  }
}

export const LightLarge: Story = {
  args: {
    type: 'light',
    label: 'Press me',
    disabled: false,
    size: 'large'
  }
}

export const LightDisabled: Story = {
  args: {
    type: 'light',
    label: 'Press me',
    disabled: true
  }
}
