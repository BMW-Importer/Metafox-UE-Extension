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
  lightTheme,
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";

import FileGear from "@spectrum-icons/workflow/FileGear";
import actions from "../config.json";
import { extensionId } from "./Constants";

const CAR_MODEL_API_URL =
  "https://productdata-int1.api.bmw//pdh/categoryhub/v1.0/all/bmw+marketB4R1+bmw_rs+sr_RS/latest";
export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);
  const [headers, setHeaders] = useState();
  const [path, setPath] = useState("");
  const [savingInProgress, setSavingInProgress] = useState(false);
  const [carModels, setCarModels] = useState();
  const [applicableCarModels, setApplicableCarModels] = useState([]);
  const [carSerieses, setCarSerieses] = useState([]);
  const [selectedCarSeries, setSelectedCarSeries] = useState();
  const [selectedCarModel, setSelectedCarModel] = useState();

  const onCarModelChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setSelectedCarModel(value);
    guestConnection.host.field.onChange(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CAR_MODEL_API_URL);
        const data = await response.json();
        const carModelsGroupedByCarSeries = data?.models?.reduce(
          (result, item) => {
            const seriesCode = item.seriesCode;
            if (!result[seriesCode]) {
              result[seriesCode] = [];
            }
            result[seriesCode].push(item.modelCode);
            return result;
          },
          {}
        );

        console.log(carModelsGroupedByCarSeries);
        setCarModels(carModelsGroupedByCarSeries);
        setCarSerieses(Object.keys(carModelsGroupedByCarSeries));

        const connection = await attach({ id: extensionId });
        setGuestConnection(connection);

        const currrentCarModel = await connection.host.field.getValue();
        console.log(">> currrentCarModel", currrentCarModel);
        

        if (carModelsGroupedByCarSeries && currrentCarModel) {
          let currentCarSeries = null;
          for (let seriesCode in carModelsGroupedByCarSeries) {
            if (
              carModelsGroupedByCarSeries[seriesCode].includes(currrentCarModel)
            ) {
              currentCarSeries = seriesCode;
              break;
            }
          }

          console.log(
            "selectedCarModel",
            currrentCarModel,
            "selectedCarSeries",
            currentCarSeries
          );

          // get field value
          setSelectedCarSeries(currentCarSeries);
          setSelectedCarModel(currrentCarModel);
          setApplicableCarModels(carModelsGroupedByCarSeries[currentCarSeries]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCarSeries) {
      setApplicableCarModels(carModels[selectedCarSeries]);
    }
  }, [selectedCarSeries]);

  return (
    <Provider theme={lightTheme} colorScheme="light">
      <Flex direction="column">
        <Form isHidden={loading}>
          series: {JSON.stringify(selectedCarSeries)}
          model: {JSON.stringify(selectedCarModel)}
          applicableMOdels: {JSON.stringify(applicableCarModels)}
          <Picker
            label="Car Series"
            necessityIndicator="label"
            onSelectionChange={setSelectedCarSeries}
            placeholder="Select a series"
            selectedKey={selectedCarSeries}
            isRequired
          >
            {carSerieses.map((item) => (
              <Item key={item}>{item}</Item>
            ))}
          </Picker>
          <Picker
            label="Car Model"
            necessityIndicator="label"
            onSelectionChange={onCarModelChangeHandler}
            placeholder="Select a model"
            isRequired
            selectedKey={selectedCarModel}
            // defaultSelectedKey={selectedCarModel}
            // isDisabled={!selectedCarSeries}
          >
            {applicableCarModels?.map((modelCode) => (
              <Item key={modelCode}>{modelCode}</Item>
            ))}
          </Picker>
        </Form>
        <View isHidden={!loading}>
          <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            gap={"size-200"}
          >
            <ProgressCircle size="L" aria-label="Loading..." isIndeterminate />
            <i>Loading...</i>
          </Flex>
        </View>
      </Flex>{" "}
    </Provider>
  );
}
