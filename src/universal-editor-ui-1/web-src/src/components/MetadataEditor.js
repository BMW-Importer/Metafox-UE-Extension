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
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import FileGear from "@spectrum-icons/workflow/FileGear";
import actions from "../config.json";
import { extensionId } from "./Constants";

const METADATA_FIELDS = {
  "jcr:title": "Title",
  "jcr:description": "Description",
  "jcr:image": "Image",
  "jcr:tags": "Tags",
  "jcr:feed": "Feed",
  "jcr:robots": "",
  "og:title": "",
  "og:description": "",
  "og:image": "",
  "og:tags": "",
  "og:feed": "",
  "twitter:title": "",
  "twitter:description": "",
  "twitter:image": "",
  "twitter:tags": "",
  "twitter:feed": "",
  theme: "Theme",
  template: "Template",
};

const metadata_field_keys = Object.keys(METADATA_FIELDS);

const CAR_MODEL_API_URL =
  "https://productdata-int1.api.bmw//pdh/categoryhub/v1.0/all/bmw+marketB4R1+bmw_rs+sr_RS/latest";
export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);
  const [headers, setHeaders] = useState();
  const [path, setPath] = useState("");
  const [savingInProgress, setSavingInProgress] = useState(false);
  const [carModels, setCarModels] = useState([]);
  const [applicableCarModels, setApplicableCarModels] = useState([]);
  const [carSerieses, setCarSerieses] = useState([]);

  let { handleSubmit, control, reset, watch } = useForm({
    defaultValues: {},
  });

  const selectedCarSeries = watch("carSeries");

  useEffect(() => {
    if (selectedCarSeries) {
      setApplicableCarModels(carModels[selectedCarSeries]);
    }
  }, [selectedCarSeries]);

  let onSubmit = async (data) => {
    console.log("data from form ~ ", data);
    setSavingInProgress(true);
    try {
      const response = await fetch(actions["update-metadata"], {
        method: "POST",
        headers,
        body: JSON.stringify({ url: path, metadata: data }),
      });
      const result = await response.json();
      console.log("updated metadata: ~ ", result);
    } catch (error) {
      console.log("Could not load experiment", error);
    } finally {
      setSavingInProgress(false);
    }
  };

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId });
      const state = await guestConnection.host.editorState.get();
      const token = await guestConnection.sharedContext.get("token");
      const org = await guestConnection.sharedContext.get("orgId");
      const location = new URL(state.location);
      const builtHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-aem-host": location.protocol + "//" + location.host,
        "x-gw-ims-org-id": org,
      };
      const metadataPath = location.pathname.replace(".html", "");
      setPath(metadataPath);
      console.log({ state, token, org, location, builtHeaders });
      setHeaders(builtHeaders);

      try {
        const response = await fetch(actions["get-metadata"], {
          method: "POST",
          headers: builtHeaders,
          body: JSON.stringify({ url: location.pathname.replace(".html", "") }),
        });
        const result = await response.json();
        console.log("~ metadata fetched: ", result);
        reset(result);
      } catch (error) {
        console.log("~ Could not load experiment");
      }
      setGuestConnection(guestConnection);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    fetch(CAR_MODEL_API_URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("~ car model data fetched: ", data);
        const groupedBySeriesCode = Object.groupBy(
          data.models,
          ({ seriesCode }) => seriesCode
        );
        console.log({ result: groupedBySeriesCode });
        setCarSerieses(Object.keys(groupedBySeriesCode));
        setCarModels(groupedBySeriesCode);
      })
      .catch((error) => {
        console.error("~ error while fetching car models ", error);
      });
  }, []);

  return (
    <Provider theme={defaultTheme} colorScheme="light" height={"100vh"}>
      <Flex direction="column" height={"100vh"}>
        <View UNSAFE_className="StickyHeader">
          <View paddingStart="size-200">
            <Flex height="size-600" alignItems="center">
              <FileGear aria-label="Metadata editor" size="S" />
              <Heading margin={0} level={4} marginStart={16}>
                Metadata
              </Heading>
            </Flex>
          </View>
          <Divider size="S" width="100%" />
        </View>
        <View padding="size-200" flex="1">
          <Form onSubmit={handleSubmit(onSubmit)} isHidden={loading}>
            <Controller
              control={control}
              name="carSeries"
              render={({ field: { name, value, onChange, onBlur, ref } }) => (
                <Picker
                  label="Series"
                  necessityIndicator="label"
                  onSelectionChange={onChange}
                  placeholder="Select a series"
                  selectedKey={value}
                  isRequired
                >
                  {carSerieses.map((item) => (
                    <Item key={item}>{item}</Item>
                  ))}
                </Picker>
              )}
            />
            <Controller
              control={control}
              name="carModel"
              render={({ field: { value, onChange } }) => (
                <Picker
                  label="Model"
                  necessityIndicator="label"
                  onSelectionChange={onChange}
                  placeholder="Select a model"
                  isRequired
                  selectedKey={value}
                  isDisabled={!selectedCarSeries}
                >
                  {applicableCarModels.map((item) => (
                    <Item key={item.modelCode}>{item.modelCode}</Item>
                  ))}
                </Picker>
              )}
            />
            <Divider size="S" marginTop={16} marginBottom={8} />

            {metadata_field_keys.map((field) => (
              <Controller
                key={field}
                control={control}
                name={field}
                render={({ field: { name, value, onChange, onBlur, ref } }) => (
                  <TextField
                    label={METADATA_FIELDS[field] || field}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    ref={ref}
                  />
                )}
              />
            ))}

            <Button
              type="submit"
              variant="cta"
              marginTop={32}
              isPending={savingInProgress}
            >
              Save
            </Button>
          </Form>
          <View isHidden={!loading} height="100%">
            <Flex
              direction="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
              gap={"size-200"}
            >
              <ProgressCircle
                size="L"
                aria-label="Loading..."
                isIndeterminate
              />
              <i>Loading metadata...</i>
            </Flex>
          </View>
        </View>
      </Flex>{" "}
    </Provider>
  );
}
