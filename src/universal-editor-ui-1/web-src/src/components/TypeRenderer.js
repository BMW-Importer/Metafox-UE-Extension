/*
 * <license header>
 */

import {
  Button,
  Divider,
  Flex,
  Form,
  Heading,
  Item,
  Picker,
  ProgressCircle,
  Provider,
  TextField,
  View,
  defaultTheme,
  lightTheme
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import FileGear from "@spectrum-icons/workflow/FileGear";
import actions from "../config.json";
import { extensionId } from "./Constants";
import { useParams } from "react-router-dom";

export default () => {
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState();
  const [model, setModel] = useState();
  const [value, setValue] = useState();
  const [error, setError] = useState();
  const [validationState, setValidationState] = useState();

  const { rendererId } = useParams();
  if (!rendererId) {
    console.error("Renderer id parameter is missed");
    return;
  }

  useEffect(() => {
    const init = async () => {
      // connect to the host
      const connection = await attach({ id: extensionId });
      setConnection(connection);
      // get model
      setModel(await connection.host.field.getModel());
      // get field value
      setValue(await connection.host.field.getValue());
      // get field error
      setError(await connection.host.field.getError());
      // get field validation state
      setValidationState(await connection.host.field.getValidationState());
      setIsLoading(false);
    };
    init().catch((e) =>
      console.log("Extension got the error during initialization:", e)
    );
  }, []);

  const onChangeHandler = (v) => {
    console.log("onChange on extension side", v);
    connection.host.field.onChange(v);
  };

  return (
    <Provider theme={lightTheme} colorScheme="light">
      {!isLoading ? (
        <>
          <Flex direction="column" gap="size-65" marginBottom="size-100">
            <TextField
              validationState={error ? "invalid" : validationState}
              label={` 🥲 ${model.multi ? null : model.label}`}
              aria-label={model.label || model.name}
              defaultValue={value}
              maxLength={model.validation.maxLength}
              isReadOnly={model.readOnly}
              isDisabled={model.readOnly}
              isRequired={model.required}
              errorMessage={error}
              onChange={onChangeHandler}
              width="100%"
            />
          </Flex>
        </>
      ) : (
        <View width="97%" height="100%">
          <ProgressCircle />
        </View>
      )}
    </Provider>
  );
};
