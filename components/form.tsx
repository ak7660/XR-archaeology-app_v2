import _ from "lodash";
import { useEffect, useState } from "react";
import { KeyboardTypeOptions, StyleSheet, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useAppTheme, AppTheme } from "@providers/style_provider";

type Validator<T> = (value: T) => string | undefined;

interface FormField<T> {
  value?: T;
  onChange?: (value: T) => void;
  validator?: Validator<T> | Validator<T>[];
  label?: string;
  keyboardType?: KeyboardTypeOptions;
  flex?: number;
  inner?: FormField<T>[];
  maxLength?: number;
  onPress?: () => void;
  /** Hide what is typed (passwords), with a button to show it. */
  secure?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Autofill hint, e.g. "email", "password", "new-password", "one-time-code". */
  autoComplete?: any;
  editable?: boolean;
}

export interface Props {
  fields: FormField<string>[];
  setValid?: (value: boolean) => void;
  spacing?: number;
}

export default function Form({ fields, setValid, spacing }: Props) {
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const [errors, setErrors] = useState<(string | undefined)[]>(fields.map((_) => undefined));
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const valid = errors.every((it) => it === undefined || !it.length);
    setValid?.(valid);
  }, [errors]);

  function renderInput(field: FormField<string>, index: number) {
    return (
      <View key={index} style={[style.column, { rowGap: theme.spacing.xs }]}>
        <TextInput
          label={field.label}
          mode="outlined"
          theme={{ ...theme, colors: { background: theme.colors.container } }}
          outlineColor={theme.colors.grey4}
          value={field.value}
          keyboardType={field.keyboardType}
          secureTextEntry={field.secure && !revealed[index]}
          autoCapitalize={field.autoCapitalize ?? (field.secure ? "none" : undefined)}
          autoComplete={field.autoComplete}
          autoCorrect={field.secure || field.keyboardType === "email-address" ? false : undefined}
          editable={field.editable}
          right={
            field.secure ? (
              <TextInput.Icon
                icon={revealed[index] ? "eye-off" : "eye"}
                onPress={() => setRevealed((r) => ({ ...r, [index]: !r[index] }))}
                forceTextInputFocus={false}
              />
            ) : undefined
          }
          onChangeText={(value) => {
            if (field.maxLength && value.length > field.maxLength) return;
            if (field.validator) {
              var list = [...errors];
              const validators = Array.isArray(field.validator) ? field.validator : [field.validator];
              for (const validator of validators) {
                const error = validator(value);
                list[index] = error;
              }
              setErrors(list);
            }
            field.onChange?.(value);
          }}
          onPressIn={field.onPress}
        />
        {errors[index] && errors[index]?.length && <Text style={{ color: theme.colors.error }}>{errors[index]}</Text>}
      </View>
    );
  }

  return (
    <View style={[style.column, { rowGap: spacing ?? theme.spacing.lg }]}>
      {fields.map((field, index) =>
        field.inner ? (
          <View key={index} style={[style.row, { gap: theme.spacing.xs }]}>
            {field.inner.map((f, i) => (
              <View style={{ flex: f.flex }} key={`f${i}`}>
                {renderInput(f, i)}
              </View>
            ))}
          </View>
        ) : (
          renderInput(field, index)
        )
      )}
    </View>
  );
}

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    column: { display: "flex", flexDirection: "column" },
    row: { flexDirection: "row", alignItems: "center" },
  });
