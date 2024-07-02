/*
* <license header>
*/

import {
  Flex,
  Form,
  Item,
  Picker,
  ProgressCircle,
  Provider,
  View,
  lightTheme,
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { priConExtensionId,SERIES,MARKET_SEGMENT } from "./Constants";

const PRECON_MODEL_API_URL = `https://productdata.api.bmw/pdh/precons/v1.0/${SERIES}/${MARKET_SEGMENT}`;

export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);

  const [carSerieses, setCarSerieses] = useState([]);
  const [selectedCarSeries, setSelectedCarSeries] = useState('');

  const [seriesCode,setSeriesCode]= useState('');
  const [rangeCode,setRangeCode]= useState('');
  const [preconId,setPreconId]= useState([]);

  
  const [carModelRange, setCarModelRange] = useState([]);
  const [selectedCarModelRange, setSelectedCarModelRange] = useState('');

  const [vehicleTypeData, setVehicleTypeData] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState('');



  const onCarSeriesChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setSelectedCarSeries(value);
    setSeriesCode(value);
    guestConnection?.host?.field.onChange(value);
  };
  
  const onCarModelRangeChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setSelectedCarModelRange(value);
    setRangeCode(value);
    guestConnection?.host?.field.onChange(`${selectedCarSeries}, ${value}`);
  };

  const onVehicleChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setSelectedVehicleType(value);
    guestConnection?.host?.field.onChange(`${selectedCarSeries}, ${selectedCarModelRange}, ${value}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(PRECON_MODEL_API_URL);
        const data = await response.json();
        const seriesCodes = Object.values(data).map(item => item.seriesCode);
        setCarSerieses(Object.values(seriesCodes));
        seriesCodes?.map((item) => setSeriesCode(item?.seriesCode));
        const connection = await attach({ id: priConExtensionId });
        setGuestConnection(connection);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
    //modelrange
  const URL = `https://productdata.api.bmw/pdh/precons/v1.0/ranges/${MARKET_SEGMENT}`;
  useEffect(() => {
    const fetchModelRange = async () => {
      if (!seriesCode) return;
      try {
        const modelDetailUrl = `${URL}/${seriesCode}`;
        const modelDetailResponse = await axios.get(modelDetailUrl);
        const modelDetail = modelDetailResponse?.data;
        const rangeCode = Object.values(modelDetail).map(item => item.modelRangeCode);
        setCarModelRange(Object.values(rangeCode));
        rangeCode?.map((item) => setRangeCode(item?.modelRangeCode));
        const connection = await attach({ id: priConExtensionId });
        setGuestConnection(connection);
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModelRange();
  }, [seriesCode]);

  const PRECON_VEHICLES_API_URL = `https://productdata.api.bmw/pdh/precons/v1.0/vehicles/${MARKET_SEGMENT}`
  useEffect(() =>{
    const fetchVehicles = async () => {
      if (!rangeCode) return;
      try {
        const modelDetailUrl = `${PRECON_VEHICLES_API_URL}/${rangeCode}?vehicle_type=PRECON`;
        const response = await axios.get(modelDetailUrl);
        const preConId = Object.values(response?.data).map(item => item?.id);
        setPreconId(preConId);
        const connection = await attach({ id: priConExtensionId });
        setGuestConnection(connection);
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
}, [rangeCode]);

const PRECON_ID_VEHICLE_API_URL = `https://productdata.api.bmw/pdh/precons/v1.0/vehicle/${MARKET_SEGMENT}`
useEffect(() => {
  const fetchVehicleByPreConId = async () => {
    if (!preconId.length) return;
    try {
      const vehicleDataPromises = preconId.map(async preconId => {
        const modelDetailUrl = `${PRECON_ID_VEHICLE_API_URL}/${preconId}`;
        const response = await axios.get(modelDetailUrl);
        return response.data;
      });

      const vehiclesData = await Promise.all(vehicleDataPromises);
      const vehicles = vehiclesData.map(vehicle => {
        const { id, name, headline } = vehicle;
        let parts = [];
        if (id) parts.push(id);
        if (name) parts.push(name);
        if (headline) parts.push(headline);
        return parts.join(', ');
      
    });
      setVehicleTypeData(vehicles);

      const connection = await attach({ id: priConExtensionId });
      setGuestConnection(connection);
    } catch (error) {
      console.error('Error fetching details for model', error);
    } finally {
      setLoading(false);
    }
  };

  fetchVehicleByPreConId();
}, [preconId]);


  return (
    <Provider theme={lightTheme} colorScheme="light">
      <Flex direction="column">
        <Form isHidden={loading}  UNSAFE_className="precon-form">
          <Picker
            label="Series"
            necessityIndicator="label"
            onSelectionChange={onCarSeriesChangeHandler}
            placeholder="Select a series"
            selectedKey={selectedCarSeries}
            isRequired
          >
            {[...new Set(carSerieses)]?.map((item) => (
               <Item textValue={item} key={item}>{item}</Item>
            ))}
          </Picker>
          <Picker
            label="Model Range"
            necessityIndicator="label"
            onSelectionChange={onCarModelRangeChangeHandler}
            placeholder="Select a model"
            isRequired
            isDisabled={!selectedCarSeries}
            selectedKey={selectedCarModelRange}
          >
            {[...new Set(carModelRange)]?.map((rangeCode) => (
              <Item  textValue={rangeCode} key={rangeCode}>{rangeCode}</Item>
            ))}
          </Picker>
          <Picker
            label="PreCon ID"
            necessityIndicator="label"
            onSelectionChange={onVehicleChangeHandler}
            placeholder="Select a PreCon Id"
            isRequired
            isDisabled={!selectedCarModelRange}
            selectedKey={selectedVehicleType}
          >
              {/* Render "(NO Value)" option if preconData is empty or null */}
              {vehicleTypeData && vehicleTypeData.length > 0 ? (
             [...new Set(vehicleTypeData)].map((item) => (
                <Item key={item} textValue={item}>
                  {item}
                </Item>
              ))
            ) : (
              <Item textValue="(NO Value)">
                (NO Value Find)
              </Item>
            )}
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