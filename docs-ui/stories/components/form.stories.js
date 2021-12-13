import NewBooleanField from 'sentry/views/settings/components/forms/booleanField';
import Form from 'sentry/views/settings/components/forms/form';
import RadioField from 'sentry/views/settings/components/forms/radioField';
import SelectField from 'sentry/views/settings/components/forms/selectField';
import TextField from 'sentry/views/settings/components/forms/textField';

export default {
  title: 'Components/Forms/Form',
  args: {
    alignRight: false,
    required: false,
    visible: true,
    disabled: false,
    flexibleControlStateSize: true,
    inline: true,
    stacked: true,
  },
};

export const Default = ({...fieldProps}) => {
  return (
    <Form>
      <TextField
        name="textfieldflexiblecontrol"
        label="Text Field With Flexible Control State Size"
        placeholder="Type text and then delete it"
        {...fieldProps}
      />
      <NewBooleanField name="field" label="New Boolean Field" {...fieldProps} />
      <RadioField
        name="radio"
        label="Radio Field"
        choices={[
          ['choice_one', 'Choice One'],
          ['choice_two', 'Choice Two'],
          ['choice_three', 'Choice Three'],
        ]}
        {...fieldProps}
      />
      <SelectField
        name="select"
        label="Select Field"
        choices={[
          ['choice_one', 'Choice One Gazillion'],
          ['choice_two', 'Choice Two'],
          ['choice_three', 'Choice Three'],
        ]}
        placeholder="Placeholder"
        {...fieldProps}
      />
    </Form>
  );
};

Default.storyName = 'Form';
Default.parameters = {
  docs: {
    description: {
      story:
        'Use the knobs to see how the different field props that can be used affect the form layout.',
    },
  },
};
