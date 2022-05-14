import { InputBaseComponentProps, TextField } from "@mui/material";
import React, { ChangeEventHandler, CSSProperties } from "react";

interface IInput {
  label: string;
  value: string | number;
  marginTop?: number;
  maxWidth?: boolean;
  width?: string | number;
  rows?: number;
  maxRows?: number;
  variant?: "standard" | "outlined";
  password?: boolean;
  style?: CSSProperties;
  inputProps?: InputBaseComponentProps;
  onChange: ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>;
}

const Input = (props: IInput) => {
  const {
    password = false,
    variant = "standard",
    style = {},
    maxWidth = false,
    width = "160px",
    marginTop = 0,
    ...rest
  } = props;

  return (
    <TextField
      {...rest}
      multiline={props?.rows > 1}
      type={password ? "password" : "text"}
      variant={variant}
      style={{
        margin: `${marginTop || 5}px 0`,
        width: maxWidth ? "100%" : width,
        ...style,
      }}
    />
  );
};

export default Input;
