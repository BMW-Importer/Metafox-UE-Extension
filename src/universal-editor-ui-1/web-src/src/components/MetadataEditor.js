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
  Checkbox
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { extensionId, BASE_DEV, BASE_PROD, LATEST, MODEL_BASE_DEV_URL, MODEL_BASE_PROD_URL  } from "./Constants";
import actions from '../config.json';

export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);
  const [carModelRange, setCarModelRange] = useState([]);
  const [selectedCarModelRange, setSelectedCarModelRange] = useState();
  const [seriesCode,setSeriesCode]= useState('');
 
  const [carSerieses, setCarSerieses] = useState([]);
  const [selectedCarSeries, setSelectedCarSeries] = useState();
 
 
  const [carModels, setCarModels] = useState([]);
  const [modelCode, setModelCode] = useState();
  const [selectedCarModels, setSelectedCarModels] = useState();
 
 
  const [vehicleData, setVehicleData] = useState([]);
  const [selectedTransmissionCode, setSelectedTransmissionCode] = useState();
  const [carModelByTransmission, setCarModelByTransmission] = useState({});
 
  let [selected, setSelected] = useState(false);
 
  const [data, setData] = useState(null);
  const[tenant, setTenant] =useState('');
  const [model, setModel] = useState([]);
  const[error, setError] =useState(null);
  const [envi, setEnvi] = useState('');

  let CAR_MODEL_API_URL = ``;
  if(setEnvi === 'dev'){
    CAR_MODEL_API_URL = `${BASE_DEV}${tenant}${LATEST}`;
  }
  else{
    CAR_MODEL_API_URL = `${BASE_PROD}${tenant}${LATEST}`;
  }

  let apiURL = ``;
  if(setEnvi === 'dev'){
    apiURL = `${MODEL_BASE_DEV_URL}${tenant}${LATEST}`;
  }
  else{
    apiURL = `${MODEL_BASE_PROD_URL}${tenant}${LATEST}`;
  }

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);
    })()
  }, []);
  
    useEffect(() => {
      const extensionCORS = async () => {
        try {
          if(guestConnection){
            const state = await guestConnection.host.editorState.get();
            const token = await guestConnection.sharedContext.get('token');
            const org = await guestConnection.sharedContext.get('orgId');
            const location = new URL(state.location);
            const builtHeaders = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                'x-aem-host': location.protocol + '//' + location.host,
                'x-gw-ims-org-id': org,
            };
            const response = await fetch(actions["get-metadata"], {
              method: 'POST',
              headers: builtHeaders,
              body: JSON.stringify({ url: location.pathname })
            });
            const responseData = await response.json();
            setTenant(responseData.tenant);
            setEnvi(responseData.env);
          }
         
        } catch (error) {
          setError(error);
        }
         finally {
          setLoading(false);
        }
      }
      extensionCORS();
    },[extensionId,guestConnection]);
 
 
  const onCarSeriesChangeHandler = (value) => {
    setSelectedCarSeries(value);
    setCarModelRange([]);
    guestConnection?.host?.field.onChange(value);
  };
 
  const onCarModelRangeChangeHandler = (value) => {
    setSelectedCarModelRange(value);
    setSeriesCode(value);
    guestConnection?.host?.field.onChange(`${selectedCarSeries}, ${value}`);
  };
 
  const onCarModelsChangeHandler = (value) => {
    const selectedModel = carModels.find(model => model.displayString === value);
    if (selectedModel) {
      const { displayString, modelCode } = selectedModel;
      setSelectedCarModels(displayString);
      setModelCode(modelCode);
      guestConnection?.host?.field.onChange(`${selectedCarSeries}, ${selectedCarModelRange}, ${modelCode}, ${displayString}, ${selected},`);
    }
  };
  const onCarTransmissionChangeHandler = (value) => {
    setSelectedTransmissionCode(value);
    guestConnection?.host?.field.onChange(`${selectedCarSeries}, ${selectedCarModelRange}, ${modelCode}, ${selectedCarModels}, ${selected}, ${value}`);
  };
 
  useEffect(() => {
    const getDataValue = async () => {
      if(guestConnection){
        const modelData = await guestConnection.host.field.getValue();
        setModel([modelData]);
        if (modelData) {
          const [series, modelRange, modelCode, selectedCarModel, isSelected, transmissionCode] = modelData.split(', ');
   
          setSelectedCarSeries(series);
          setSelectedCarModelRange(modelRange);
          setSelectedCarModels(selectedCarModel);
          setModelCode(modelCode);
          setSelected(isSelected === 'true');
          setSelectedTransmissionCode(transmissionCode);
        }
      }
    }
    getDataValue();
  }, [guestConnection]);
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        if(tenant){
          const response = await fetch(CAR_MODEL_API_URL);
        const data = await response.json();
        setData(data);
        const seriesCodes = data?.models?.map((item) => item?.seriesCode);
        setCarSerieses(seriesCodes);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
 
    fetchData();
  }, [tenant]);
 
  useEffect(() => {
    const handleSeriesChange = async () => {
      if (selectedCarSeries) {
        try {
          const modelRange = data?.models?.filter(item => item?.seriesCode === selectedCarSeries).map(item => item?.modelRangeCode);
          setCarModelRange(modelRange);
        } catch (error) {
        }
      }
    };
 
    handleSeriesChange();
  }, [selectedCarSeries, data]);
 
  useEffect(() => {
    const handleModelRangeChange = async () => {
      if (selectedCarModelRange) {
        try {
          const modelCodes = data?.models?.filter(item => item?.modelRangeCode === selectedCarModelRange);
          const modelCodesDetails = modelCodes.map((item, index) => {
            const {shortName,  modelCode } = item;
            return {
              displayString: `${shortName} (${modelCode})`,
              modelCode
            };
          });
          setCarModels(modelCodesDetails);
        } catch (error) {
        }
      }
     
    };
 
    handleModelRangeChange();
  }, [selectedCarModelRange, data, extensionId]);
 
  useEffect(() => {
    const fetchVehiclesData = async () => {
      if (!modelCode) return;
      try {
        if(tenant){
          const modelDetailUrl = `${apiURL}/${modelCode}`;
          const modelDetailResponse = await axios.get(modelDetailUrl);
          const modelDetail = modelDetailResponse?.data;
          setVehicleData(modelDetail?.vehicles);
        }
        
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
 
    fetchVehiclesData();
  }, [tenant,modelCode]);
 
  useEffect(() => {
    const groupByTransmission = async () => {
      if (vehicleData.length > 0) {
        try {
          const groupedByTransmission = vehicleData.reduce((result, vehicle) => {
            const { transmissionCode } = vehicle;
            if (!result[modelCode]) {
              result[modelCode] = [];
            }
            if (!result[modelCode].includes(transmissionCode)) {
              result[modelCode].push(transmissionCode);
            }
            return result;
          }, {});
          setCarModelByTransmission(groupedByTransmission);
        } catch (error) {
        }
      }
    };
 
    groupByTransmission();
  }, [vehicleData, modelCode, extensionId]);
 

  return (
    <Provider theme={lightTheme} colorScheme="light">
      <Flex direction="column">
        <Form isHidden={loading} UNSAFE_style={{backgroundColor:'#fdfdfd'}} UNSAFE_className="meta-data-form">
          <Picker
            label="Series"
            necessityIndicator="label"
            onSelectionChange={onCarSeriesChangeHandler}
            placeholder="Select a Series"
            selectedKey={selectedCarSeries}
            isRequired
             description="Defines the Series."
          >
            {[...new Set(carSerieses)]?.map((item) => (
              <Item key={item} value={item}>{item}</Item>
            ))}
          </Picker>
          <Picker
            label="Model Range"
            necessityIndicator="label"
            onSelectionChange={onCarModelRangeChangeHandler}
            placeholder="Select a Model Range"
            isRequired
            selectedKey={selectedCarModelRange}
            isDisabled={!selectedCarSeries}
             description="Defines the Model Range. "
          >
            {[...new Set(carModelRange)].map((modelrangeCode) => (
              <Item key={modelrangeCode}>
                {modelrangeCode}
              </Item>
            ))}
          </Picker>
 
          <Picker
            label="Model Code (Type Code)"
            necessityIndicator="label"
            onSelectionChange={onCarModelsChangeHandler}
            placeholder="Select a Model Code"
            isRequired
            selectedKey={selectedCarModels}
            isDisabled={!selectedCarModelRange}
             description="Defines the Model Code (Type Code)."
          >
            {[...new Set(carModels)]?.map((modelCode) => (
              <Item key={modelCode.displayString} value={modelCode.displayString}>
              {modelCode.displayString}
            </Item>
            ))}
          </Picker>
          <Checkbox isSelected={selected} onChange={setSelected}>
            Enable Technical Data
          </Checkbox>
          <p className="Checkbox-helper">Defines if technical data is enabled.</p>
          {selected && <Picker
            label="Transmission Type"
            necessityIndicator="label"
            onSelectionChange={onCarTransmissionChangeHandler}
            placeholder="Select a Transmission Type"
            isRequired
            selectedKey={selectedTransmissionCode}
            isDisabled={!selectedCarModels}
            description="Defines the transmission type. The values will be populated by WDH based on the previous selections."
          >
            {carModelByTransmission[modelCode]?.length ? (
              carModelByTransmission[modelCode].map((transmission) => (
                <Item key={transmission} value={transmission}>{transmission}</Item>
              ))
            ) : (
              <Item value="No transmission code">No transmission code</Item>
            )}
 
          </Picker>}
 
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
      </Flex>
    </Provider>
  );
}
 