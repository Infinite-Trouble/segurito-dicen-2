## Para correr el test de carga basta con configurarlo en apache jmeter

En apache usted describirá:
1. Cantidad de usuarios (threads).
2. Ramp-up o tiempo en llegar
3. Loop count o cuántas veces cada thread ejecutará su tarea
4. Tiempo de duración del test

Además usted tendrá que definir una ruta a una imagen analizable. Esa imagen analizable debe cumplir con el formato, que para estas pruebas de carga fue 'carnet'.

Para poder generar los gráficos usted debe correr en esta misma carpeta el siguiente comando en terminal:

´´´
 jmeter -n -t loadtest.jmx -l resultados_hito5_X.jtl
´´´
donde _X define qué test está haciendo (segundo, tercero, etc)


